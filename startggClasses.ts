
export class GraphQLResponse<T>{
    data?: T;
    extensions?: any;
    actionRecords?: Array<any>;
}
export class Tournament {
    id?: number;
    name?: string;
    events?: Array<GameEvent>
}
export class GameEvent {
    id?: number;
    name?: string;
    sets?: Page<Set>;
    videogame?: VideoGame;
}
export class VideoGame {
    id?: string | number;
    characters?: Array<Character>;
    displayName?: string;
    name?: string;
    slug?: string;
}
export class Character {
    id?: string | number;
    name?: string;
}
export class Page<T> {
    pageInfo?: PageInfo;
    nodes?: Array<T>;
}
export class PageInfo {
    total?: number;
    page?: number;
    perPage?: number;
}
export class Slot {
    id?: number;
    entrant?: Array<Entrant>;
}
export class Set {
    id?: number;
    slots?: Array<Slot>;
    stream?: Stream;
    games?: Array<Game>;
    fullRoundText?: string;
}
export class Stream {
    id?: string | number;
    name?: string;
}
export class Entrant {
    id?: number;
    event?: GameEvent;
    initialSeedNum?: number;
    isDisqualified?: boolean;
    name?: string;
    particpants?: Array<Participant>;
    skill?: number;
}
export class Game { 
    id?: string | number;
    selections?: Array<GameSelection>;
    stage?: Stage;
    state?: number;
    winnerId?: number;
}
export class GameSelection {
    id?: string | number;
    entrant?: Entrant;
    orderNum?: number;
    participant?: Participant;
    selectionType?: GameSelectionType;
    selectionValue?: number;
}
export enum GameSelectionType {
    CHARACTER
}
export class Stage {
    id?: string | number;
    name?: string;
}
export class Participant {
    id?: string | number;
    checkedIn?: boolean;
    checkedInAt?: number; //unix time stamp
    connectedAccounts: any;
    email?: string;
    entrants?: Array<Entrant>;
    events?: Array<GameEvent>;
    gamerTag?: string;
    prefix?: string;
    verified?: boolean;
}