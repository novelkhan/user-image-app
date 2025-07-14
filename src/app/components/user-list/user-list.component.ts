import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
})
export class UserListComponent implements OnInit {
  users: any[] = [];

  constructor(public service: UserService, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.service.getAllUsers().subscribe((res) => (this.users = res));
  }

  deleteUser(id: number) {
    if (confirm('Are you sure?')) {
      this.service.deleteUser(id).subscribe(() => {
        this.toastr.success('Deleted!');
        this.loadUsers();
      });
    }
  }
}