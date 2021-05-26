export class Product {
  _id: string;
  name: string;
  category: {
    _id: string;
    name: string;
  }[];
  description: string;
  price: number;
  deliveryFee: number;
  forPickupOnly: boolean;
  image: string;
  stock: number;
  isBestseller: boolean;
}
