import { Pipe, PipeTransform } from '@angular/core';
import { resetFakeAsyncZone } from '@angular/core/testing';

@Pipe({
  name: 'filterProduct'
})

export class ProductFilterPipe implements PipeTransform {

  transform(items: any[], searchBy: string, searchText: string): any[] {
    if (!items) {
      return [];
    }
    if (!searchText) {
      return items;
    }
    searchText = searchText.toLowerCase();

    return items.filter(it => {
        if (searchBy === 'Product name') {
            if (it.name !== null && it.name !== undefined) {
                return JSON.stringify(it.name).toLowerCase().includes(searchText);
            }
        } else if (searchBy === 'Category name') {
            if (it.category !== null && it.category !== undefined) {
                if (Array.isArray(it.category) && it.category.length > 0) {
                    for (let i=0; i<it.category.length; i++) {
                        if (it.category[i].name != null && it.category[i].name != ''
                            && it.category[i].name.toLowerCase().includes(searchText))  {
                                return true;
                        }
                    }
                }
            }
        }

        return false;
    });
  }
}
