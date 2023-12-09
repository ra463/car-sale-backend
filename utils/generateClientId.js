exports.generateClientId = () => {
  let clientId = "";
  const possible = "0123456789";

  for (let i = 0; i < 6; i++) {
    clientId += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return clientId;
};

exports.generateAuctionId = () => {
  let auctionId = "";
  const possible = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (let i = 0; i < 8; i++) {
    auctionId += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return auctionId;
};
