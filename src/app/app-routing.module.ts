import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './_guards/auth.guard';

import { HomeComponent } from './home/home.component';
import { AboutUsComponent } from './aboutus/aboutus.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { ProductsComponent } from './products/products.component';
import { LoginComponent } from './login/login.component';
import { CartComponent } from './cart/cart.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { TrackOrderComponent } from './track-order/track-order.component';

import { AdminOverviewComponent } from './admin-overview/admin-overview.component';
import { AdminAccountsComponent } from './admin-accounts/admin-accounts.component';
import { AdminAccountDetailComponent } from './admin-account-detail/admin-account-detail.component';
import { AdminCategoriesComponent } from './admin-categories/admin-categories.component';
import { AdminContentComponent } from './admin-content/admin-content.component';
import { AdminProductsComponent } from './admin-products/admin-products.component';
import { AdminProductDetailComponent } from './admin-product-detail/admin-product-detail.component';
import { AdminRegisterComponent } from './admin-register/admin-register.component';
import { AdminSettingsComponent } from './admin-settings/admin-settings.component';
import { AdminCustomersComponent } from './admin-customers/admin-customers.component';
import { AdminCustomerDetailComponent } from './admin-customer-detail/admin-customer-detail.component';
import { AdminOrdersComponent } from './admin-orders/admin-orders.component';
import { AdminOrderDetailsComponent } from './admin-order-details/admin-order-details.component';
import { AdminOrderCreateComponent } from './admin-order-create/admin-order-create.component';
import { AdminOrderEditComponent } from './admin-order-edit/admin-order-edit.component';
import { ProductDetailComponent } from './product-detail/product-detail.component';
import { OrderConfirmationComponent } from './order-confirmation/order-confirmation.component';

const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'aboutus', component: AboutUsComponent },
    { path: 'admin', component: AdminOverviewComponent, canActivate: [AuthGuard] },
    { path: 'admin/accounts', component: AdminAccountsComponent, canActivate: [AuthGuard] },
    { path: 'admin/accounts/:id', component: AdminAccountDetailComponent, canActivate: [AuthGuard] },
    { path: 'admin/categories', component: AdminCategoriesComponent, canActivate: [AuthGuard] },
    { path: 'admin/content', component: AdminContentComponent, canActivate: [AuthGuard] },
    { path: 'admin/products', component: AdminProductsComponent, canActivate: [AuthGuard] },
    { path: 'admin/customers', component: AdminCustomersComponent, canActivate: [AuthGuard] },
    { path: 'admin/customers/:id', component: AdminCustomerDetailComponent, canActivate: [AuthGuard] },
    { path: 'admin/orders', component: AdminOrdersComponent, canActivate: [AuthGuard] },
    { path: 'admin/orders/create', component: AdminOrderCreateComponent, canActivate: [AuthGuard] },
    { path: 'admin/orders/:id', component: AdminOrderDetailsComponent, canActivate: [AuthGuard] },
    { path: 'admin/orders/:id/edit', component: AdminOrderEditComponent, canActivate: [AuthGuard] },
    { path: 'admin/products/:id', component: AdminProductDetailComponent, canActivate: [AuthGuard] },
    // { path: 'register', component: AdminRegisterComponent },
    { path: 'admin/settings', component: AdminSettingsComponent, canActivate: [AuthGuard] },
    { path: 'cart', component: CartComponent },
    { path: 'checkout', component: CheckoutComponent },
    { path: 'order-confirmation', component: OrderConfirmationComponent },
    { path: 'track-order', component: TrackOrderComponent },
    { path: 'contactus', component: ContactUsComponent },
    { path: 'products', component: ProductsComponent },
    { path: 'products/:id', component: ProductDetailComponent},
    { path: 'login', component: LoginComponent }
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })
    ],
    exports: [
        RouterModule
    ]
})
export class AppRoutingModule { }
