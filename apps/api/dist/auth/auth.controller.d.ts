import { AuthService } from './auth.service';
import { RegistroOrganizacionDto } from './dto/registro-organizacion.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    registrarOrganizacion(dto: RegistroOrganizacionDto): Promise<{
        accessToken: string;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
    }>;
}
