interface ValidatorMetaData {
    [propName: string]: ValidatorConfig[];    
}

interface ValidatorConfig {
    name: string;
    config?: ValidatorConfigParams | LengthValidatorConfigParams | GroupValidatorConfigParams | string[];
}

interface ValidatorConfigParams {
    [propName: string]: any;
}

interface LengthValidatorConfigParams {
    minLength?: number,
    maxLength?: number
}

interface GroupValidatorConfigParams {
    subscriber?: string;
    source?: SourceParamsConfigGroup;
}

interface SourceParamsConfig {
    [propName: string]: any;
}

interface SourceParamsConfigGroup {
    group: SourceParamsConfig[] |  string[];
}
