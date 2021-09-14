import { Component, OnInit, Inject } from '@angular/core';
import { ContentService } from '../_services/content.service';
import { ContactService } from '../_services/contact.service';
import { CategoryService } from '../_services/category.service';
import { SocialmediaService } from '../_services/socialmedia.service';
import { UploadService } from '../_services/upload.service';
import { Content, Item } from '../_models/content';
import { Contact } from '../_models/contact';
import { Category } from '../_models/category';
import { SocialMedia } from '../_models/socialmedia';
import { Observable, of } from 'rxjs';
import { finalize, tap, catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { baseURL } from '../_helpers/baseurl';

@Component({
  selector: 'app-admin-content',
  templateUrl: './admin-content.component.html',
  styleUrls: ['./admin-content.component.scss']
})
export class AdminContentComponent implements OnInit {

  submitted = false;
  loading: boolean;
  isImageUploading: boolean;
  content: Content;
  contact: Contact;
  socialMedia: SocialMedia;
  slideShowItems: Item[] = [];
  tempSlideShowItems: Item[] = [];
  editContentError: string;
  editContentFormGroup: FormGroup;
  editContactFormGroup: FormGroup;
  editSocialMediaFormGroup: FormGroup;
  slideShowFormGroup: FormGroup;
  categories: Observable<Category[]>;

  constructor(
    private contentService: ContentService,
    private contactService: ContactService,
    private categoryService: CategoryService,
    private socialMediaService: SocialmediaService,
    private uploadService: UploadService,
    private formBuilder: FormBuilder,
    @Inject('BaseURL') public BaseURL
  ) {
    this.editContentFormGroup = this.formBuilder.group({
      shopName: ['', Validators.required],
      shopSubtitle: ['', Validators.required],
      topBarContent: [''],
      footerDescription: ['', Validators.required]
    });

    this.editContactFormGroup = this.formBuilder.group({
      contactNo: ['', Validators.required],
      address: ['', Validators.required],
      email: ['', Validators.required]
    });

    this.editSocialMediaFormGroup = this.formBuilder.group({
      facebook: [''],
      instagram: [''],
      trademe: [''],
      twitter: [''],
      youtube: ['']
    });

    this.slideShowFormGroup = this.formBuilder.group({
      image: ['', Validators.required],
      title: [''],
      description: [''],
      url: [''],
      action: ['']
    });
  }

  ngOnInit() {
    this.getContent();
    this.getContact();
    this.getSocialMedia();
    this.getAllCategories();
  }

  save(content: Content) {
    if (content._id === undefined) {
      this.contentService.addContent(content)
        .pipe(finalize(() => {
          this.loading = false;
          this.tempSlideShowItems = [];
          this.getContent();
        }))
        .subscribe(
          data => {
            this.showMessageModal('Homepage Content Saved!');
          },
          error => {
            console.log('error: ', error);
          }
        );
    } else {
      this.contentService.updateContent(content)
        .pipe(finalize(() => {
          this.loading = false;
          this.getContent();
        }))
        .subscribe(
          data => {
            this.showMessageModal('Homepage Content Saved!');
          },
          error => {
            console.log('error: ', error);
          }
        );
    }
  }

  saveContact() {
    this.submitted = true;
    if (this.editContactFormGroup.invalid) {
      return;
    }
    this.loading = true;
    const contact: Contact = this.editContactFormGroup.value;
    // If there is an existing contact, set new contact id with the current id.
    if (this.contact !== null && this.contact !== undefined) {
      contact._id = this.contact._id;
      this.contactService.updateContact(contact)
        .pipe(finalize(() => {
          this.loading = false;
          this.getContact();
        }))
        .subscribe(
          data => {
            this.showMessageModal('Contact Details Saved!');
          },
          error => {
            console.log('error: ', error);
          }
        );
    } else {
      this.contactService.addContact(contact)
        .pipe(finalize(() => {
          this.loading = false;
          this.getContact();
        }))
        .subscribe(
          data => {
            this.showMessageModal('Contact Details Saved!');
          },
          error => {
            console.log('error: ', error);
          }
        );
    }

  }

  saveContent() {
    this.submitted = true;
    const content: Content = this.editContentFormGroup.value;

    if (this.editContentFormGroup.invalid) {
      if (content.shopName === '' || content.shopSubtitle === '' || content.footerDescription === '') {
        return;
      }
    }

    if (this.slideShowItems.length == 0 && this.tempSlideShowItems.length == 0) {
      return;
    }

    this.loading = true;

    if (this.slideShowFormGroup.valid) {
      var item: Item = this.slideShowFormGroup.value;
      this.tempSlideShowItems.push(item);
      this.slideShowFormGroup.reset();
    }

    content.slideshow = this.slideShowItems.concat(this.tempSlideShowItems);

    // If there is an existing content, set new content id with the current id.
    if (this.content !== null && this.content !== undefined) {
      content._id = this.content._id;
    }

    this.save(content);
  }

  saveSocialMedia() {
    this.submitted = true;
    // If form is invalid, return
    if (this.editSocialMediaFormGroup.invalid) {
      return;
    }
    this.loading = true;
    const socialMedia: SocialMedia = this.editSocialMediaFormGroup.value;
    // If there is an existing social media, set new social media id with the current id.
    if (this.socialMedia !== null && this.socialMedia !== undefined) {
      socialMedia._id = this.socialMedia._id;
      this.socialMediaService.updateSocialMedia(socialMedia)
        .pipe(finalize(() => {
          this.loading = false;
          this.getSocialMedia();
        }))
        .subscribe(
          data => {
            this.showMessageModal('Social Media Accounts Saved!');
          },
          error => {
            console.log('error: ', error);
          }
        );
    } else {
      this.socialMediaService.addSocialMedia(socialMedia)
        .pipe(finalize(() => {
          this.loading = false;
          this.getSocialMedia();
        }))
        .subscribe(
          data => {
            this.showMessageModal('Social Media Accounts Saved!');
          },
          error => {
            console.log('error: ', error);
          }
        );
    }
  }

  showMessageModal(message: string) {
    $('div.modal-body').text(message);
    $('#messageModal').modal('show');
  }

  getAllCategories() {
    const tempCategories: Category[] = [];
    this.categoryService.getCategories().pipe(
      tap((categories: Category[]) => {
        for (let i = 0; i < categories.length; i++) {
          if (categories[i].parent === null) {
            tempCategories.push(categories[i]);
            for (let j = 0; j < categories.length; j++) {
              if (categories[j].parent !== null && categories[j].parent._id === categories[i]._id) {
                tempCategories.push(categories[j]);
                for (let k = 0; k < categories.length; k++) {
                  if (categories[k].parent !== null && categories[k].parent._id === categories[j]._id) {
                    tempCategories.push(categories[k]);
                  }
                }
              }
            }
          }
        }
      }),
      finalize(() => {
        this.categories = of(tempCategories);
      })
    ).subscribe();
  }

  getContact() {
    this.contactService.getContact()
      .pipe(
        tap(contact => {
          this.contact = contact[0];
          this.resetContact();
        })
      ).subscribe();
  }

  getContent() {
    this.contentService.getContent()
      .pipe(
        tap(content => {
          this.content = content[0];
          this.resetContent();
        })
      ).subscribe();
  }

  getSocialMedia() {
    this.socialMediaService.getSocialMedia()
      .pipe(
        tap(socialMedia => {
          this.socialMedia = socialMedia[0];
          this.resetSocialMedia();
        })
      ).subscribe();
  }

  resetContact() {
    if (this.contact === undefined) {
      return;
    }

    this.editContactFormGroup.get('contactNo').setValue(this.contact.contactNo);
    this.editContactFormGroup.get('address').setValue(this.contact.address);
    this.editContactFormGroup.get('email').setValue(this.contact.email);
  }

  resetContent() {
    if (this.content === undefined) {
      return;
    }

    this.slideShowItems = this.content.slideshow;
    this.tempSlideShowItems = [];
    this.editContentFormGroup.get('shopName').setValue(this.content.shopName);
    this.editContentFormGroup.get('shopSubtitle').setValue(this.content.shopSubtitle);
    this.editContentFormGroup.get('topBarContent').setValue(this.content.topBarContent);
    this.editContentFormGroup.get('footerDescription').setValue(this.content.footerDescription);
  }

  resetSocialMedia() {
    if (this.socialMedia === undefined) {
      return;
    }

    this.editSocialMediaFormGroup.get('facebook').setValue(this.socialMedia.facebook);
    this.editSocialMediaFormGroup.get('instagram').setValue(this.socialMedia.instagram);
    this.editSocialMediaFormGroup.get('trademe').setValue(this.socialMedia.trademe);
    this.editSocialMediaFormGroup.get('twitter').setValue(this.socialMedia.twitter);
    this.editSocialMediaFormGroup.get('youtube').setValue(this.socialMedia.youtube);
  }

  onFileChange(event) {
    if (event.target.files) {
      this.isImageUploading = true;
      this.getSignedRequest(event.target.files[0]);
    }
  }

  getSignedRequest(file) {
    console.log('File: ', file);
    const xhr = new XMLHttpRequest();
    console.log('xhr: ', xhr);
    xhr.open('GET', `${baseURL}/sign-s3?file-name=${file.name}&file-type=${file.type}`);
    console.log('xhr: ', xhr);
    xhr.onreadystatechange = () => {
      console.log('xhr: ', xhr);
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          console.log('Response: ', xhr.responseText);
          const response = JSON.parse(xhr.responseText);
          this.uploadFile(file, response.signedRequest, response.url);
        } else {
          console.log('Could not get signed URL.');
        }
      }
    };
    xhr.send();
  }

  uploadFile(file, signedRequest, url) {
    const xhr = new XMLHttpRequest();
    console.log('uploadFile xhr: ', xhr);
    xhr.open('PUT', signedRequest);
    console.log('uploadFile xhr open: ', xhr);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          this.slideShowFormGroup.get('image').setValue(url);
        } else {
          console.log('Could not upload file.');
        }
        this.isImageUploading = false;
        this.loading = false;
      }
    };
    xhr.send(file);
  }

  addSlideShowItem() {
    if (this.slideShowFormGroup.invalid) {
      return;
    }

    var item: Item = this.slideShowFormGroup.value;

    this.tempSlideShowItems.push(item);
    this.slideShowFormGroup.reset();
  }

  removeSlideShowItem(index) {
    this.slideShowItems.splice(index, 1);
  }

  removeTempSlideShowItem(index) {
    this.tempSlideShowItems.splice(index, 1);
  }
}
