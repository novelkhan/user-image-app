import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  readonly baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getAllUsers() {
    return this.http.get<any[]>(`${this.baseUrl}/users`);
  }

  getUserById(id: number) {
    return this.http.get<any>(`${this.baseUrl}/users/${id}`);
  }

  createUser(data: FormData) {
    return this.http.post(`${this.baseUrl}/users`, data);
  }

  updateUser(id: number, data: any) {
    return this.http.put(`${this.baseUrl}/users/${id}`, data);
  }

  deleteUser(id: number) {
    return this.http.delete(`${this.baseUrl}/users/${id}`);
  }
}