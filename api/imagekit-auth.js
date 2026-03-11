import ImageKit from 'imagekit';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
      console.error('Missing environment variables');
      return res.status(500).json({ 
        error: 'Missing environment variables',
        env: {
          hasPublic: !!process.env.IMAGEKIT_PUBLIC_KEY,
          hasPrivate: !!process.env.IMAGEKIT_PRIVATE_KEY,
          hasEndpoint: !!process.env.IMAGEKIT_URL_ENDPOINT
        }
      });
    }

    const imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
    });

    // Get fileName from query parameter
    const { fileName } = req.query;
    
    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' });
    }

    // Generate authentication parameters correctly - one call only [citation:1]
    const authParams = imagekit.helper.getAuthenticationParameters();
    const token = authParams.token;
    const expire = authParams.expire;
    
    // Generate signature using the SAME token and expire [citation:5]
    const signature = imagekit.helper.getAuthenticationParameters(token, expire, fileName).signature;

    res.status(200).json({
      token,
      expire,
      signature
    });
    
  } catch (error) {
    console.error('ImageKit auth error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
}
