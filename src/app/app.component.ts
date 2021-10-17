import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
import { User } from './_models/user';
import { AuthenticationService } from './_services/authentication.service';
import { UserService } from './_services/user.service';
import { ContentService } from './_services/content.service';
import { ContactService } from './_services/contact.service';
import { ProductService } from './_services/product.service';
import { SocialmediaService } from './_services/socialmedia.service';
import { Content } from './_models/content';
import { Contact } from './_models/contact';
import { SocialMedia } from './_models/socialmedia';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {

  isAdmin: boolean;
  isLogin: boolean;
  isCustomerOrder: boolean;
  currentUser: User;
  content: Content;
  contact: Contact;
  socialMedia: SocialMedia;
  noOfItemsCart = 0;

  constructor(
    private route: Router,
    private authService: AuthenticationService,
    private userService: UserService,
    private contentService: ContentService,
    private contactService: ContactService,
    private productService: ProductService,
    private socialMediaService: SocialmediaService
  ) { }

  ngOnInit() {
    this.route.events.subscribe(
      (event: Event) => {
        if (event instanceof NavigationEnd) {
          const url = event.url.split('/')[1];
          this.isAdmin = url.startsWith('admin');
          this.isLogin = url.startsWith('login') || url.startsWith('register');
          this.isCustomerOrder = url.startsWith('order-confirmation') || url.startsWith('checkout');
          if (this.isAdmin) {
            this.getCurrentUser();
          }
        }
      }
    );
    this.getContact();
    this.getContent();
    this.getSocialMedia();
    this.loadCart();
  }

  getCurrentUser() {
    this.userService.getCurrentUser()
      .subscribe(
        data => {
          this.currentUser = data;
        }
      );
  }

  getContact() {
    this.contactService.getContact()
      .subscribe(
        contact => {
          this.contact = contact[0];
        }
      );
  }

  getContent() {
    this.contentService.getContent()
      .subscribe(
        content => {
          this.content = content[0];
          if (this.content) {
            document.title = this.content.shopName;
          }
        }
      );
  }

  getSocialMedia() {
    this.socialMediaService.getSocialMedia()
      .subscribe(
        socialMedia => {
          this.socialMedia = socialMedia[0];
        }
      );
  }

  logout() {
    this.authService.logout();
    location.replace('/login');
  }

  public loadCart() {
    this.noOfItemsCart = 0;
    let cart = localStorage.getItem('cart');
    console.log('cart: ', cart);
    if (cart) {
      cart = JSON.parse(cart);
    } else {
      return;
    }
    for (let i = 0; i < cart.length; i++) {
      const item = JSON.parse(cart[i]);
      this.noOfItemsCart += item.quantity;
    }
    $('span.shopping-cart-badge').text(this.noOfItemsCart);
  }
}
