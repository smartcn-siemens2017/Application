/**
 * This service, like the data entry service, queries for and merges duplicate drugs for given genes.
 */

import { Drug, DrugReference, InteractionType, GeneInteraction } from "./drug";
import { Observable } from "rxjs/Observable";
import { Http } from "@angular/http";
import { Injectable } from "@angular/core";
import { Gene } from "../../genomic-data";

@Injectable()
export class DrugsSearchService {
  constructor (private http: Http) {}

  public searchByReference(reference: DrugReference): Observable <Drug> {
    return this.http.get("https://dgidb.genome.wustl.edu/api/v1/interactions.json?drugs=" + (reference.name.indexOf(" ") >= 0 ? reference.name.substring(0, reference.name.indexOf(" ")) : reference.name))
      .map(result => {
        const resultJSON = result.json();

        const newDrug = new Drug(reference.name);

        if (!(resultJSON.matchedTerms && resultJSON.matchedTerms.length >= 0 && resultJSON.matchedTerms[0].interactions)) {
          return;
        }

        newDrug.interactions = [];
        const addInteractionType = (interaction: GeneInteraction, interactionTypeName: string, sourceName: string) => {
          for (const interactionType of interaction.interactionTypes) {
            if (interactionType.name === interactionTypeName) {
              interactionType.sources.push(sourceName);
              return;
            }
          }

          // Add new interaction type if source not found.
          interaction.interactionTypes.push(new InteractionType(interactionTypeName, [sourceName]));
        };
        const addInteraction = (interactionData: any) => {
          const currentGeneTarget: string = interactionData.geneName;
          const currentInteractionType: string = interactionData.interactionType;
          const currentSource: string = interactionData.source;
          for (const interaction of newDrug.interactions) {
            if (interaction.geneTarget.hugoSymbol === currentGeneTarget) {
              console.log("Found mergeable");
              addInteractionType(interaction, currentInteractionType, currentSource);
              return;
            }
          }

          newDrug.interactions.push(new GeneInteraction(new Gene(currentGeneTarget), [new InteractionType(currentInteractionType, [currentSource])]));
        };
        console.log("Interaction JSON is ", resultJSON.matchedTerms[0].interactions);
        for (const jsonInteraction of resultJSON.matchedTerms[0].interactions) {
          addInteraction(jsonInteraction);
        }

        return newDrug;
      });
  }
}
