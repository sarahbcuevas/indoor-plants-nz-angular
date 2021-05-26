import { Pipe, PipeTransform } from '@angular/core';
import { resetFakeAsyncZone } from '@angular/core/testing';

@Pipe({
  name: 'filterOrder'
})

export class OrderFilterPipe implements PipeTransform {

  transform(items: any[], searchBy: string, searchText: string): any[] {
    if (!items) {
      return [];
    }
    if (!searchText) {
      return items;
    }
    searchText = searchText.toLowerCase();

    return items.filter(it => {
        if (searchBy === 'Order ID') {
            if (it.code !== null && it.code !== undefined) {
                return JSON.stringify(it.code).toLowerCase().includes(searchText);
            }
        } else if (searchBy === 'Customer name') {
            let firstnameSearch = false;
            let lastnameSearch = false;
            if (it.customer.firstname !== null && it.customer.firstname !== undefined) {
                firstnameSearch = it.customer.firstname.toLowerCase().includes(searchText);
            }
            if (it.customer.lastname !== null && it.customer.lastname !== undefined) {
                lastnameSearch = it.customer.lastname.toLowerCase().includes(searchText);
            }
            return firstnameSearch || lastnameSearch;
        } else if (searchBy === 'Tag') {
            if (it.tags && Array.isArray(it.tags)) {
                for (let tag of it.tags) {
                    if (tag.toLowerCase().includes(searchText)) {
                        return true;
                    }
                }
            }
            return false;
        }

        return false;
    });
  }
}
