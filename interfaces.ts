export interface loginData{
    id: number,
    passwordHash: string
}

export interface newUser{
    idType: number,
    id: number,
    name: string,
    lastname: string,
    password: string,
    userType: 0 | 1 | 2 | 3
}

export interface userData extends newUser{
    uid: string
}