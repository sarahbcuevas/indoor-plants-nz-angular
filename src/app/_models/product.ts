export class Photo {
  url: string;
  isPrimary: boolean;
}

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
  images: Photo[];
  stock: number;
  isBestseller: boolean;
}
