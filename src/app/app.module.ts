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
import { CustomerService } from './_services/customer.service';
import { OrderService } from './_services/order.service';
import { ProductService } from './_services/product.service';
import { UserService } from './_services/user.service';
import { UploadService } from './_services/upload.service';
import { AdminOverviewComponent } from './admin-overview/admin-overview.component';
import { AdminAccountsComponent } from './admin-accounts/admin-accounts.component';
import { FilterPipe } from './_helpers/filter.pipe';
import { OrderFilterPipe } from './_helpers/filterOrder.pipe';
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
import { OrderConfirmationComponent } from './order-confirmation/order-confirmation.component';
import { TrackOrderComponent } from './track-order/track-order.component';
import { AdminOrdersComponent } from './admin-orders/admin-orders.component';
import { AdminCustomersComponent } from './admin-customers/admin-customers.component';
import { AdminCustomerDetailComponent } from './admin-customer-detail/admin-customer-detail.component';
import { AdminOrderDetailsComponent } from './admin-order-details/admin-order-details.component';
import { AdminOrderCreateComponent } from './admin-order-create/admin-order-create.component';
import { AdminOrderEditComponent } from './admin-order-edit/admin-order-edit.component';
import { AdminSettingsComponent } from './admin-settings/admin-settings.component';
import { CartComponent } from './cart/cart.component';

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
    OrderFilterPipe,
    ProductDetailComponent,
    ContactUsComponent,
    AdminContentComponent,
    CheckoutComponent,
    AdminRegisterComponent,
    OrderConfirmationComponent,
    TrackOrderComponent,
    AdminOrdersComponent,
    AdminCustomersComponent,
    AdminCustomerDetailComponent,
    AdminOrderDetailsComponent,
    AdminOrderCreateComponent,
    AdminOrderEditComponent,
    AdminSettingsComponent,
    CartComponent
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
    CustomerService,
    OrderService,
    { provide: 'BaseURL', useValue: baseURL }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
