const { google } = require('googleapis');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// ─── Auth client cache ────────────────────────────────────────────────────────
// Build the GoogleAuth instance once and reuse it for every Drive call.
let _cachedAuth = null;

const getAuth = () => {
  if (_cachedAuth) return _cachedAuth;

  let credentials;
  if (process.env.GOOGLE_SERVICE_ACCOUNT) {
    const json = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT, 'base64').toString('utf8');
    credentials = JSON.parse(json);
  } else {
    const keyFile = path.join(__dirname, '../../reakmusic-402a021b664e.json');
    credentials = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
  }

  _cachedAuth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return _cachedAuth;
};

// ─── OAuth token cache ────────────────────────────────────────────────────────
// Service-account tokens are valid for ~1 hour. Cache and reuse them;
// refresh only when the token is within 2 minutes of expiry.
let _cachedToken = null;
let _tokenExpiresAt = 0; // epoch ms

const getAccessToken = async () => {
  const now = Date.now();
  const bufferMs = 2 * 60 * 1000; // refresh 2 min before expiry

  if (_cachedToken && now < _tokenExpiresAt - bufferMs) {
    return _cachedToken;
  }

  const auth = getAuth();
  const client = await auth.getClient();
  const { token, res: tokenRes } = await client.getAccessToken();

  _cachedToken = token;
  // Google returns expiry_date in the token response (epoch ms); fall back to 55 min
  _tokenExpiresAt =
    tokenRes?.data?.expiry_date ?? now + 55 * 60 * 1000;

  return _cachedToken;
};

// ─── Drive helper: shared instance ───────────────────────────────────────────
const getDrive = () => google.drive({ version: 'v3', auth: getAuth() });

// ─── Public API ───────────────────────────────────────────────────────────────

const uploadFile = async (fileBuffer, fileName, mimeType) => {
  const { Readable } = require('stream');
  const stream = Readable.from(fileBuffer);
  const drive = getDrive();

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    },
    media: { mimeType, body: stream },
    fields: 'id',
  });
  return res.data.id;
};

const generateSignedUrl = async (fileId, expiryMinutes = 10) => {
  const drive = getDrive();
  const expiryDate = new Date(Date.now() + expiryMinutes * 60 * 1000);

  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
      expirationTime: expiryDate.toISOString(),
    },
  });

  const res = await drive.files.get({
    fileId,
    fields: 'webContentLink',
  });
  return res.data.webContentLink;
};

const makeFilePublic = async (fileId) => {
  const drive = getDrive();
  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
  });
};

const deleteFile = async (fileId) => {
  const drive = getDrive();
  await drive.files.delete({ fileId });
};

const streamFile = async (fileId, req, res, filename = null) => {
  // Use the cached token — no new client/token round-trip per request
  const token = await getAccessToken();

  const rangeHeader = req.headers['range'];
  const reqHeaders = { Authorization: `Bearer ${token}` };
  if (rangeHeader) reqHeaders['Range'] = rangeHeader;

  const driveRes = await axios.get(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: reqHeaders, responseType: 'stream', maxRedirects: 5 }
  );

  res.status(rangeHeader ? 206 : 200);
  ['content-type', 'content-length', 'content-range', 'accept-ranges'].forEach((h) => {
    if (driveRes.headers[h]) res.setHeader(h, driveRes.headers[h]);
  });
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length, Content-Type');
  if (filename) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  }

  driveRes.data.pipe(res);
  req.on('close', () => driveRes.data.destroy());
};

const getFileInfo = async (fileId) => {
  const drive = getDrive();
  const res = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size',
  });
  return res.data;
};

module.exports = { uploadFile, generateSignedUrl, makeFilePublic, deleteFile, streamFile, getFileInfo };
