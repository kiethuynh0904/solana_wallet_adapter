export interface IAwareNFT {
  name: string;
  symbol: string;
  description: string;
  seller_fee_basis_points: number;
  image: string;
  attributes: [{ trait_type: string; value: number; display_type: string }];
  external_url: string;
  properties: {
    files: [
      {
        uri: string;
        type: string;
      }
    ];
    category: string;
    creators: [{ address: string; share: number }];
  };
}
