import { Pipe, PipeTransform } from '@angular/core';
import { User } from '../_models/user';
import { Product } from '../_models/product';

@Pipe({
  name: 'filter'
})

export class FilterPipe implements PipeTransform {
  transform(items: any[], searchText: string): any[] {
    if (!items) {
      return [];
    }
    if (!searchText) {
      return items;
    }
    searchText = searchText.toLowerCase();

    return items.filter(it => {
      let usernameSearch = false;
      let nameSearch = false;
      if (it.username !== null && it.username !== undefined) {
        usernameSearch = it.username.toLowerCase().includes(searchText);
      }
      if (it.name !== null && it.name !== undefined) {
        nameSearch = it.name.toLowerCase().includes(searchText);
      }
      return usernameSearch || nameSearch;
    });
  }
}
