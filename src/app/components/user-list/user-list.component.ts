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

  getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  isImage(fileName: string): boolean {
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(this.getFileExtension(fileName));
  }

  isPDF(fileName: string): boolean {
    return this.getFileExtension(fileName) === 'pdf';
  }

  downloadFile(storedName: string, originalName: string) {
    const fileUrl = `${this.service.baseUrl}/${storedName}`;

    fetch(fileUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = originalName;
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('Download error:', error);
        alert('Failed to download file.');
      });
  }
}