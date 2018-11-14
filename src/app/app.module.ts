import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { AppRoutingModule } from './/app-routing.module';
import { AboutUsComponent } from './aboutus/aboutus.component';
import { ProductsComponent } from './products/products.component';
import { LoginComponent } from './login/login.component';

import { AuthenticationService } from './_services/authentication.service';
import { CategoryService } from './_services/category.service';
import { ContactService } from './_services/contact.service';
import { ContentService } from './_services/content.service';
import { SendMailService } from './_services/send-mail.service';
import { SocialmediaService } from './_services/socialmedia.service';
import { ProductService } from './_services/product.service';
import { UserService } from './_services/user.service';
import { UploadService } from './_services/upload.service';
import { AdminOverviewComponent } from './admin-overview/admin-overview.component';
import { AdminAccountsComponent } from './admin-accounts/admin-accounts.component';
import { FilterPipe } from './_helpers/filter.pipe';
import { JwtInterceptor } from './_helpers/jwt.interceptor';
import { ErrorInterceptor } from './_helpers/error.interceptor';
import * as $ from 'jquery';
import * as bootstrap from 'bootstrap';
import { AdminAccountDetailComponent } from './admin-account-detail/admin-account-detail.component';
import { AdminCategoriesComponent } from './admin-categories/admin-categories.component';
import { AdminProductsComponent } from './admin-products/admin-products.component';
import { AdminProductDetailComponent } from './admin-product-detail/admin-product-detail.component';
import { FileUploadModule } from 'ng2-file-upload';
import { baseURL } from './_helpers/baseurl';
import { ProductDetailComponent } from './product-detail/product-detail.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { AdminContentComponent } from './admin-content/admin-content.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { AdminRegisterComponent } from './admin-register/admin-register.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    AboutUsComponent,
    ProductsComponent,
    LoginComponent,
    AdminOverviewComponent,
    AdminAccountsComponent,
    AdminAccountDetailComponent,
    AdminCategoriesComponent,
    AdminProductsComponent,
    AdminProductDetailComponent,
    FilterPipe,
    ProductDetailComponent,
    ContactUsComponent,
    AdminContentComponent,
    CheckoutComponent,
    AdminRegisterComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    FileUploadModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    AuthenticationService,
    CategoryService,
    ContactService,
    ContentService,
    SendMailService,
    SocialmediaService,
    ProductService,
    UserService,
    UploadService,
    { provide: 'BaseURL', useValue: baseURL }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
