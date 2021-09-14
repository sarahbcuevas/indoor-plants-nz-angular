export class Item {
  image: string;
  title: string;
  description: string;
  url: string;
  action: string;
}

export class Content {
  _id: string;
  shopName: string;
  shopSubtitle: string;
  topBarContent: string;
  slideshow: Item[];
  footerDescription: string;
}
