export class Category {
  _id: string;
  name: string;
  parent: {
    _id: string;
    name: string;
    parent: {
      _id: string;
      name: string;
    };
  };
}
