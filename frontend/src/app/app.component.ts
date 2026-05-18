import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'REakMusic';

  constructor(private translate: TranslateService, private router: Router) { }

  ngOnInit(): void {
    const savedLang = localStorage.getItem('lang');
    const browserLang = navigator.language.split('-')[0];
    const lang = savedLang || (browserLang === 'km' ? 'km' : 'en');
    this.translate.use(lang);

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      });
  }
}
