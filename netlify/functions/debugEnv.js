exports.handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT
    })
  };
};
