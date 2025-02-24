export interface loginData{
    identification: string,
    passwordHash: string
}

export interface newUser{
    idType: number,
    idNumber: string,
    name: string,
    lastname: string,
    password: string,
    userType: 0 | 1 | 2 | 3
}

export interface userData extends newUser{
    uid: string
}