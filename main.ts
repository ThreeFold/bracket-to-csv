import * as csv from "https://deno.land/x/csv/mod.ts";
import { Tournament, Set, GameEvent, Character } from './startggClasses.ts';
class SetExportDefinition {
    EventIconPath:string;
    GameIconPath: string; 
    Player1Name: string;
    Player1Character1ArtPath: string;
    Player1Character2ArtPath: string; 
    Player2Name: string;
    Player2Character1ArtPath: string;
    Player2Character2ArtPath: string;
    Round: string;

    constructor(partial: Partial<SetExportDefinition>){
        this.EventIconPath = partial.EventIconPath ?? "";
        this.GameIconPath = partial.GameIconPath ?? "";
        this.Player1Name = partial.Player1Name ?? "";
        this.Player1Character1ArtPath = partial.Player1Character1ArtPath ?? "";
        this.Player1Character2ArtPath = partial.Player1Character2ArtPath ?? "";
        this.Player2Name = partial.Player2Name ?? "";
        this.Player2Character1ArtPath = partial.Player2Character1ArtPath ?? "";
        this.Player2Character2ArtPath = partial.Player2Character2ArtPath ?? "";
        this.Round = partial.Round ?? "";
    }
}
const configString = await Deno.readTextFile('./config.json');
const config = JSON.parse(configString);
const startggDevToken = config.API_KEY;
const apiUrl = 'https://api.start.gg/gql/alpha';
async function GetTourneyInfo(slug: string): Promise<Tournament>{
    const query = {
        query: `		
        query GetTournamentInfo($slug: String!){
            tournament(slug: $slug){
                id
                name
                events {
				    id
				    name
			    }
		    }
        }`,
        variables: {
            slug
        }
    };
    const response = await fetch(`${apiUrl}`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            Accept:'application/json',
            Authorization: `Bearer ${startggDevToken}`
        },
        body: JSON.stringify(query)
    });
    const responseBody = await response.json();
    const tournamentData: Tournament = responseBody.data.tournament;
    return tournamentData;
}

async function GetEventSetPage(eventId: number, page = 1, perPage = 20): Promise<GameEvent> {
    const query = {
        query: `query EventSets($eventId: ID!, $page: Int!, $perPage: Int!) {
            event(id: $eventId) {
              id
              name
              videogame {
                  id
                  characters {
                      id
                      name
                  }
                  name
                  slug
              }
              sets(
                page: $page
                perPage: $perPage
                sortType: STANDARD
              ) {
                pageInfo {
                  total,
                  page,
                  perPage
                }
                nodes {
                  id
                  fullRoundText
                  games {
                    state
                    selections {
                      entrant {
                        id
                        name
                      }
                      selectionType
                      selectionValue
                    }
                  }
                  stream {
                      id
                  }
                  slots {
                    id
                    entrant {
                      id
                      name
                    }
                  }
                }
              }
            }
          }`,
          variables: {
              eventId,
              page,
              perPage
          }
    };
    const response = await fetch(`${apiUrl}`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            Accept:'application/json',
            Authorization: `Bearer ${startggDevToken}`
        },
        body: JSON.stringify(query)
    });
    const eventBody = (await response.json()).data.event;
    return eventBody;
}
async function GetEventInfo(id: number): Promise<GameEvent>{
    let page = 1;
    let response = await GetEventSetPage(id);

    const sets = new Array<Set>();
    if(response.sets?.nodes){
        sets.push(...response.sets?.nodes);
    }
    while(response.sets?.pageInfo?.total ?? 0 > (response.sets?.pageInfo?.page ?? 0)* (response.sets?.pageInfo?.perPage ?? 0)){
        page += 1;
        response = await GetEventSetPage(id, page, response.sets?.pageInfo?.perPage);
        if(response.sets?.nodes){
            sets.push(...response.sets?.nodes);
        }
    }
    if(response.sets){
        response.sets.nodes = sets;
        if(response.sets.pageInfo){
            response.sets.pageInfo.page = 1;
            response.sets.pageInfo.perPage = 0;
            response.sets.pageInfo.total = sets.length;
        }
    }
    return response;
}

class PlayerCharacterDetails {
    id?: string | number;
    name?: string;
    characterNames?: Array<string>;
}
const eventId = 720463;
console.log("Grabbing Event details from start.gg...", `EventId: ${eventId}`);
const eventInfo = await GetEventInfo(eventId);

function slugToGameIconPath(slug?: string){
    switch(slug){
        case "game/ultimate-1":
            return './assets/ssbu/icon_180x240_white.png';
        default:
            return "";
    }
}
const setsToExport = new Array<SetExportDefinition>();

function getGameCharacter(characters: Character[] | undefined, characterId: number): Character {
    return characters?.find(c => c.id === characterId) ?? new Character();
}
console.log("Processing records...");
if(eventInfo.sets?.nodes){
    for(const set of eventInfo.sets?.nodes){
        if(set.stream) {
            const setToExport = new SetExportDefinition({});
            setToExport.EventIconPath = './assets/events/abu/logo.png';
            setToExport.GameIconPath  = slugToGameIconPath(eventInfo.videogame?.slug);
            const players = new Array<PlayerCharacterDetails>();
            setToExport.Round = set.fullRoundText ?? "";
            if(set.games) {
                for(const game of set.games){
                    if(game.selections){
                        for(const selection of game.selections){
                            const playerName = selection.entrant?.name;
                            const playerId = selection.entrant?.id;
                            const gameCharacter = getGameCharacter(eventInfo.videogame?.characters, selection.selectionValue ?? 0);
                            const player = players.find(p => p.id === playerId);
                            if(player?.characterNames){
                                if(!player.characterNames.some(c => c === gameCharacter.name ?? "")){
                                    player.characterNames.push(gameCharacter.name ?? "");
                                }
                            }
                            else {
                                players.push({
                                    id: playerId,
                                    name: playerName,
                                    characterNames: [gameCharacter.name ?? ""]
                                });
                            }
                        }
                    }
                }
            }
            const player1 = players[0];
            const player2 = players[1];
            if(player1.characterNames){
                setToExport.Player1Character1ArtPath = characterNameToArtPath(player1.characterNames[0]);
                setToExport.Player1Character2ArtPath = characterNameToArtPath(player1.characterNames[1]);
            }
            setToExport.Player1Name = player1.name ?? "";
            if(player2.characterNames){
                setToExport.Player2Character1ArtPath = characterNameToArtPath(player2.characterNames[0]);
                setToExport.Player2Character2ArtPath = characterNameToArtPath(player2.characterNames[1]);
            }
            setToExport.Player2Name = player2.name ?? "";
            setsToExport.push(setToExport);
        }
    }
}


function characterNameToArtPath(characterName: string|undefined): string {
    if(!characterName){
        return "";
    }
    return `./assets/ssbu/${characterName.toLowerCase()}_960x1080.png`;
}
const asyncObjectGenerator = async function*(){
    for(const setToExport of setsToExport){
        yield { 
            EventIconPath: setToExport.EventIconPath,
            GameIconPath: setToExport.GameIconPath,
            Player1Name: setToExport.Player1Name,
            Player1Character1ArtPath: setToExport.Player1Character1ArtPath,
            Player1Character2ArtPath: setToExport.Player1Character2ArtPath,
            Player2Name: setToExport.Player2Name,
            Player2Character1ArtPath: setToExport.Player2Character1ArtPath,
            Player2Character2ArtPath: setToExport.Player2Character2ArtPath,
            Round: setToExport.Round
         };
    }
}
const header = [
    'EventIconPath',
    'GameIconPath',
    'Player1Name',
    'Player1Character1ArtPath',
    'Player1Character2ArtPath',
    'Player2Name',
    'Player2Character1ArtPath',
    'Player2Character2ArtPath',
    'Round'];

const fileName = `./startgg_${eventId}.csv`;
console.log(`Writing ${setsToExport.length} records to ${fileName}`);
const file = await Deno.create(fileName);
await csv.writeCSVObjects(file, asyncObjectGenerator(), {
    header: header
});

file.close();