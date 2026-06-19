import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: '有効なメールアドレスを入力してください' })
  @IsNotEmpty({ message: 'メールアドレスを入力してください' })
  email!: string;

  @IsNotEmpty({ message: 'パスワードを入力してください' })
  @MinLength(6, { message: 'パスワードは6文字以上で入力してください' })
  password!: string;
}
