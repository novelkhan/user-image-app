import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  images: File[] = [];
  previews: string[] = [];
  removedImages: string[] = [];
  editing: boolean = false;
  userId: number = 0;
  existingImages: string[] = [];

  constructor(
    private fb: FormBuilder,
    private service: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
  ) {
    this.userForm = this.fb.group({
      name: [''],
      email: [''],
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.editing = true;
      this.userId = +idParam;
      this.service.getUserById(this.userId).subscribe((user) => {
        this.userForm.patchValue({
          name: user.name,
          email: user.email,
        });
        this.existingImages = user.photos.map((p: any) => p.url);
        this.previews = user.photos.map((p: any) => this.service.baseUrl + '/' + p.url);
      });
    }
  }

  onFileChange(event: any) {
    const files = event.target.files;
    for (let file of files) {
      this.images.push(file);
      const reader = new FileReader();
      reader.onload = (e: any) => this.previews.push(e.target.result);
      reader.readAsDataURL(file);
    }
  }

  removeImage(index: number) {
    if (index < this.existingImages.length) {
      const removed = this.existingImages.splice(index, 1)[0];
      this.removedImages.push(removed);
    } else {
      const newImageIndex = index - this.existingImages.length;
      this.images.splice(newImageIndex, 1);
    }
    this.previews.splice(index, 1);
  }

  onSubmit() {
    const formData = new FormData();
    formData.append('name', this.userForm.value.name);
    formData.append('email', this.userForm.value.email);

    this.images.forEach((img) => {
      formData.append('photos', img);
    });

    if (this.editing) {
      this.removedImages.forEach((img) =>
        formData.append('removedImages[]', img),
      );

      this.service.updateUser(this.userId, formData).subscribe(() => {
        this.toastr.success('User updated successfully');
        this.router.navigate(['/']);
      });
    } else {
      this.service.createUser(formData).subscribe(() => {
        this.toastr.success('User created successfully');
        this.router.navigate(['/']);
      });
    }
  }
}