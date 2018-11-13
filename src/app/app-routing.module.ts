import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './_guards/auth.guard';

import { HomeComponent } from './home/home.component';
import { AboutUsComponent } from './aboutus/aboutus.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { ProductsComponent } from './products/products.component';
import { LoginComponent } from './login/login.component';
import { CheckoutComponent } from './checkout/checkout.component';

import { AdminOverviewComponent } from './admin-overview/admin-overview.component';
import { AdminAccountsComponent } from './admin-accounts/admin-accounts.component';
import { AdminAccountDetailComponent } from './admin-account-detail/admin-account-detail.component';
import { AdminCategoriesComponent } from './admin-categories/admin-categories.component';
import { AdminContentComponent } from './admin-content/admin-content.component';
import { AdminProductsComponent } from './admin-products/admin-products.component';
import { AdminProductDetailComponent } from './admin-product-detail/admin-product-detail.component';
import { ProductDetailComponent } from './product-detail/product-detail.component';

const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'aboutus', component: AboutUsComponent },
    { path: 'admin', component: AdminOverviewComponent, canActivate: [AuthGuard] },
    { path: 'admin/accounts', component: AdminAccountsComponent, canActivate: [AuthGuard] },
    { path: 'admin/accounts/:id', component: AdminAccountDetailComponent, canActivate: [AuthGuard] },
    { path: 'admin/categories', component: AdminCategoriesComponent, canActivate: [AuthGuard] },
    { path: 'admin/content', component: AdminContentComponent, canActivate: [AuthGuard] },
    { path: 'admin/products', component: AdminProductsComponent, canActivate: [AuthGuard] },
    { path: 'admin/products/:id', component: AdminProductDetailComponent, canActivate: [AuthGuard] },
    { path: 'checkout', component: CheckoutComponent },
    { path: 'contactus', component: ContactUsComponent },
    { path: 'products', component: ProductsComponent },
    { path: 'products/:id', component: ProductDetailComponent},
    { path: 'login', component: LoginComponent }
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes)
    ],
    exports: [
        RouterModule
    ]
})
export class AppRoutingModule { }
