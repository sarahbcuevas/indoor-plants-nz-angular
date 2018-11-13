import { Component, OnInit, Inject } from '@angular/core';
import { ContentService } from '../_services/content.service';
import { ContactService } from '../_services/contact.service';
import { CategoryService } from '../_services/category.service';
import { SocialmediaService } from '../_services/socialmedia.service';
import { UploadService } from '../_services/upload.service';
import { Content } from '../_models/content';
import { Contact } from '../_models/contact';
import { Category } from '../_models/category';
import { SocialMedia } from '../_models/socialmedia';
import { Observable, of } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { FileUploader } from 'ng2-file-upload/ng2-file-upload';
import { baseURL } from '../_helpers/baseurl';
import { literal } from '@angular/compiler/src/output/output_ast';

const URL = baseURL + '/uploads';

interface UploadResponse {
  success: boolean;
  path: string;
}

@Component({
  selector: 'app-admin-content',
  templateUrl: './admin-content.component.html',
  styleUrls: ['./admin-content.component.scss']
})
export class AdminContentComponent implements OnInit {

  submitted = false;
  loading: boolean;
  content: Content;
  contact: Contact;
  socialMedia: SocialMedia;
  editContentError: string;
  editContentFormGroup: FormGroup;
  editContactFormGroup: FormGroup;
  editSocialMediaFormGroup: FormGroup;
  tempImage: string;
  categories: Observable<Category[]>;

  public uploader: FileUploader = new FileUploader({ url: URL, itemAlias: 'photo'});

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
      jumbotronImage: ['', Validators.required],
      jumbotronTitle: ['', Validators.required],
      jumbotronDescription: ['', Validators.required],
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
      twitter: [''],
      youtube: ['']
    });
  }

  ngOnInit() {
    this.getContent();
    this.getContact();
    this.getSocialMedia();
    this.getAllCategories();
    this.uploader.onAfterAddingFile = (file) => {
      file.withCredentials = false;
    };
  }

  save(content: Content) {
    if (content._id === undefined) {
      this.contentService.addContent(content)
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
      if ((content.jumbotronImage === null || content.jumbotronImage === undefined || content.jumbotronImage === '') &&
        (this.content !== undefined && this.content.jumbotronImage !== null && this.content.jumbotronImage !== undefined)) {
          // proceed
      } else {
        return;
      }

      if (content.shopName === '' || content.shopSubtitle === '' || content.jumbotronTitle === '' ||
        content.jumbotronDescription === '' || content.footerDescription === '') {
        return;
      }
    }

    this.loading = true;
    // If there is an existing content, set new content id with the current id.
    if (this.content !== null && this.content !== undefined) {
      content._id = this.content._id;
    }
    // If a new image has been selected, upload image then set content jumbotronImage to the path of the uploaded image
    if (content.jumbotronImage !== null && content.jumbotronImage !== '' && content.jumbotronImage !== undefined) {
      this.uploader.onCompleteItem = (item: any, response: any, status: any, headers: any) => {
        const resp: UploadResponse = JSON.parse(response);
        if (resp.success) {
          // Delete old jumbotron image to conserve storage
          if (this.content !== null && this.content !== undefined &&
            this.content.jumbotronImage !== null && this.content.jumbotronImage !== '' && this.content.jumbotronImage !== undefined) {
            const pathToDelete = this.content.jumbotronImage.replace('/images/', '');
            this.uploadService.deleteUpload(pathToDelete).subscribe();
          }
          content.jumbotronImage = resp.path;
        }
        this.save(content);
      };
      this.uploader.uploadAll();
    } else {
      // If user did not select new image, retain the old image.
      content.jumbotronImage = this.content.jumbotronImage;
      this.save(content);
    }
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
    if (this.tempImage) {
      this.content.jumbotronImage = this.tempImage;
      this.tempImage = '';
    }

    this.editContentFormGroup.get('shopName').setValue(this.content.shopName);
    this.editContentFormGroup.get('shopSubtitle').setValue(this.content.shopSubtitle);
    this.editContentFormGroup.get('jumbotronTitle').setValue(this.content.jumbotronTitle);
    this.editContentFormGroup.get('jumbotronDescription').setValue(this.content.jumbotronDescription);
    this.editContentFormGroup.get('footerDescription').setValue(this.content.footerDescription);
    this.editContentFormGroup.get('jumbotronImage').reset();
  }

  resetSocialMedia() {
    if (this.socialMedia === undefined) {
      return;
    }

    this.editSocialMediaFormGroup.get('facebook').setValue(this.socialMedia.facebook);
    this.editSocialMediaFormGroup.get('instagram').setValue(this.socialMedia.instagram);
    this.editSocialMediaFormGroup.get('twitter').setValue(this.socialMedia.twitter);
    this.editSocialMediaFormGroup.get('youtube').setValue(this.socialMedia.youtube);
  }
}
