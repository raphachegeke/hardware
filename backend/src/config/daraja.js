import axios from 'axios';
import 'dotenv/config';

const { DARJA_CONSUMER_KEY, DARJA_CONSUMER_SECRET, DARJA_SHORTCODE, DARJA_PASSKEY } = process.env;

let accessTokenCache = null;

export const getDarajaToken = async () => {
  if (accessTokenCache) return accessTokenCache;

  const res = await axios.get(
    'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    {
      auth: { username: DARJA_CONSUMER_KEY, password: DARJA_CONSUMER_SECRET }
    }
  );

  accessTokenCache = res.data.access_token;
  setTimeout(() => (accessTokenCache = null), 3500 * 1000); // expires ~1h
  return accessTokenCache;
};

export const stkPush = async ({ phone, amount, accountRef }) => {
  const token = await getDarajaToken();
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const password = Buffer.from(DARJA_SHORTCODE + DARJA_PASSKEY + timestamp).toString('base64');

  const payload = {
    BusinessShortCode: DARJA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerBuyGoodsOnline',
    Amount: amount,
    PartyA: phone,
    PartyB: 6444134,
    PhoneNumber: phone,
    CallBackURL: 'https://hardware-gg4y.onrender.com/api/payments/daraja-callback',
    AccountReference: accountRef,
    TransactionDesc: 'Hardware purchase'
  };

  const response = await axios.post(
    'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return response.data;
};