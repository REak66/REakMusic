const { google } = require('googleapis');

const path = require('path');
const fs = require('fs');

const getAuth = () => {
  let credentials;
  if (process.env.GOOGLE_SERVICE_ACCOUNT) {
    const json = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT, 'base64').toString('utf8');
    credentials = JSON.parse(json);
  } else {
    const keyFile = path.join(__dirname, '../../reakmusic-402a021b664e.json');
    credentials = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
  }
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
};

const uploadFile = async (fileBuffer, fileName, mimeType) => {
  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });
  const { Readable } = require('stream');
  const stream = Readable.from(fileBuffer);

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
  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });
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
  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });
  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
  });
};

const deleteFile = async (fileId) => {
  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });
  await drive.files.delete({ fileId });
};

const streamFile = async (fileId, req, res, filename = null) => {
  const axios = require('axios');
  const auth = getAuth();
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();

  const rangeHeader = req.headers['range'];
  const reqHeaders = { Authorization: `Bearer ${token}` };
  if (rangeHeader) reqHeaders['Range'] = rangeHeader;

  const driveRes = await axios.get(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: reqHeaders, responseType: 'stream', maxRedirects: 5 }
  );

  res.status(rangeHeader ? 206 : 200);
  ['content-type', 'content-length', 'content-range', 'accept-ranges'].forEach(h => {
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
  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });
  const res = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size',
  });
  return res.data;
};

module.exports = { uploadFile, generateSignedUrl, makeFilePublic, deleteFile, streamFile, getFileInfo };
