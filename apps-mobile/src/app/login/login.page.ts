import { NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonSpinner,
} from '@ionic/angular/standalone';
import { APP_VERSION } from '../../environments/version';
import { AuthService } from '../shared/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  imports: [
    FormsModule,
    NgIf,
    IonButton,
    IonContent,
    IonInput,
    IonItem,
    IonLabel,
    IonSpinner,
  ],
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  errorMessage = '';
  isSubmitting = false;
  readonly appVersion = APP_VERSION;

  login() {
    this.errorMessage = '';
    this.isSubmitting = true;

    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.isSubmitting = false;
        void this.router.navigateByUrl('/home', { replaceUrl: true });
      },
      error: () => {
        this.isSubmitting = false;
        this.errorMessage = 'Credenciais invalidas ou sem acesso mobile.';
      },
    });
  }
}
