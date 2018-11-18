import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ContactService } from '../_services/contact.service';
import { ContentService } from '../_services/content.service';
import { SocialmediaService } from '../_services/socialmedia.service';
import { Contact } from '../_models/contact';
import { Content } from '../_models/content';
import { SocialMedia } from '../_models/socialmedia';
import { SendMailService } from '../_services/send-mail.service';
import { Message } from '../_models/message';
import { finalize, tap } from 'rxjs/operators';

@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss']
})
export class ContactUsComponent implements OnInit {

  contactUsFormGroup: FormGroup;
  submitted: boolean;
  loading: boolean;
  socialMedia: SocialMedia;
  contactDetails: Contact;
  content: Content;

  constructor(
    private formBuilder: FormBuilder,
    private contactService: ContactService,
    private contentService: ContentService,
    private sendMailService: SendMailService,
    private socialMediaService: SocialmediaService
  ) {
    this.contactUsFormGroup = this.formBuilder.group({
      name: [''],
      contact: [''],
      email: ['', Validators.required],
      type: ['', Validators.required],
      message: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.getSocialMedia();
    this.getContactDetails();
    this.getContent();
  }

  getContactDetails() {
    this.contactService.getContact()
      .pipe(
        tap(contact => {
          this.contactDetails = contact[0];
        })
      ).subscribe();
  }

  getContent() {
    this.contentService.getContent()
      .subscribe(
        content => {
          this.content = content[0];
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

  resetForm() {
    this.contactUsFormGroup.reset();
  }

  submit() {
    this.submitted = true;
    if (this.contactUsFormGroup.invalid) {
      return;
    }
    this.loading = true;
    const content: Message = this.contactUsFormGroup.value;
    this.sendMailService.sendMail(content)
      .pipe(finalize(() => {
        this.loading = false;
        this.submitted = false;
        this.resetForm();
      }))
      .subscribe(
        success => {
          // TODO: Prompt user that the message was sent successfully
          console.log('Message sent successfully!');
        },
        error => {
          console.log('Message sending failed.');
        }
      );
  }

}
