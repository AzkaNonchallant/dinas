import {prisma} from '../../config/database';
import type {RegisterInput} from './auth.schema';

export const authRepository = {
    findByEmail(email:string) {
        return prisma.user.findUnique({where: {email}});
    },

    findById(id: number) {
        return prisma.user.findUnique({
            where: {id},
            include: {Departemen: true, Position: true},
        });
    },

    create(data: RegisterInput & {password: string}) {
        return prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: data.password,
                departementId: data.departementId,
                positionId: data.positionId,
            },
        });
    },
};