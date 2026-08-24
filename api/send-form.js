const nodemailer = require('nodemailer');

const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }

  const { name, phone, city } = req.body || {};

  if (!name || !phone || !city) {
    return res.status(400).json({ success: false, message: 'Name, phone and city are required.' });
  }

  const cleanName = String(name).trim().slice(0, 100);
  const cleanPhone = String(phone).trim().slice(0, 20);
  const cleanCity = String(city).trim().slice(0, 100);

  if (!cleanName || !cleanCity || !PHONE_PATTERN.test(cleanPhone)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid name, phone number and city.' });
  }

  const { GMAIL_USER, GMAIL_APP_PASSWORD, TO_EMAIL } = process.env;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.error('Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables.');
    return res.status(500).json({ success: false, message: 'Server email is not configured.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"New Cambridge College Website" <${GMAIL_USER}>`,
      to: TO_EMAIL || GMAIL_USER,
      subject: `New Enquiry from ${cleanName}`,
      text: `Name: ${cleanName}\nPhone: ${cleanPhone}\nCity: ${cleanCity}`,
      html: `<p><strong>Name:</strong> ${escapeHtml(cleanName)}</p><p><strong>Phone:</strong> ${escapeHtml(cleanPhone)}</p><p><strong>City:</strong> ${escapeHtml(cleanCity)}</p>`,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Failed to send enquiry email:', error);
    return res.status(500).json({ success: false, message: 'Failed to send email.' });
  }
};
