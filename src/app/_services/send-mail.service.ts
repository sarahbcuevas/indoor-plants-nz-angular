import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { baseURL } from '../_helpers/baseurl';
import { Message } from '../_models/message';

@Injectable({
  providedIn: 'root'
})
export class SendMailService {

  public sendMailUrl = baseURL + '/send';

  constructor(
    private http: HttpClient
  ) { }

  sendMail(message: Message) {
    return this.http.post(this.sendMailUrl, message);
  }
}
