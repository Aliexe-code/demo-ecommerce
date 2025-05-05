export type ProductResponse = {
  message: string;
  product: {
    id: string;
    title: string;
    description: string;
    price: number;
    userId: string;
  };
};
