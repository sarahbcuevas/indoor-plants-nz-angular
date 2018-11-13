import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
import { User } from './_models/user';
import { AuthenticationService } from './_services/authentication.service';
import { UserService } from './_services/user.service';
import { ContentService } from './_services/content.service';
import { ContactService } from './_services/contact.service';
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
  currentUser: User;
  content: Content;
  contact: Contact;
  socialMedia: SocialMedia;

  constructor(
    private route: Router,
    private authService: AuthenticationService,
    private userService: UserService,
    private contentService: ContentService,
    private contactService: ContactService,
    private socialMediaService: SocialmediaService
  ) { }

  ngOnInit() {
    this.route.events.subscribe(
      (event: Event) => {
        if (event instanceof NavigationEnd) {
          const url = event.url.split('/')[1];
          this.isAdmin = url.startsWith('admin');
          this.isLogin = url.startsWith('login');
          if (this.isAdmin) {
            this.getCurrentUser();
          }
        }
      }
    );
    this.getContact();
    this.getContent();
    this.getSocialMedia();
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
          document.title = this.content.shopName;
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
}
