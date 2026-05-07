const { google } = require('googleapis');

const getAuth = () => {
  const serviceAccountJson = Buffer.from(
    process.env.GOOGLE_SERVICE_ACCOUNT || '',
    'base64'
  ).toString('utf8');
  const credentials = JSON.parse(serviceAccountJson);
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

const deleteFile = async (fileId) => {
  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });
  await drive.files.delete({ fileId });
};

module.exports = { uploadFile, generateSignedUrl, deleteFile };
