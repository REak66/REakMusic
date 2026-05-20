import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileComponent } from './profile/profile.component';
import { OrdersComponent } from './orders/orders.component';

const routes: Routes = [
  { path: '', redirectTo: 'profile', pathMatch: 'full' },
  { path: 'profile', component: ProfileComponent },
  { path: 'subscription', component: OrdersComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
