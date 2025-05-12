

import { InferenceClient } from '@huggingface/inference';

export const FIELD_WEIGHTS = {
  category: 10,
  itemName: 20,
  location: 20,
  date: 10,
  description: 40,
};

const API_KEY = import.meta.env.VITE_HF_API_KEY || '';

const hf = new InferenceClient(API_KEY);

// Cosine similarity calculation
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  const dotProduct = vec1.reduce((acc, val, i) => acc + val * vec2[i], 0);
  const magnitude1 = Math.sqrt(vec1.reduce((acc, val) => acc + val * val, 0));
  const magnitude2 = Math.sqrt(vec2.reduce((acc, val) => acc + val * val, 0));
  return dotProduct / (magnitude1 * magnitude2);
}

async function getEmbedding(model: string, inputs: [string, string]): Promise<number[][] | null> {
  try {
    const response = await hf.featureExtraction({ model, inputs });
    if (response && Array.isArray(response) && response.length === 2 &&
        Array.isArray(response[0]) && Array.isArray(response[1])) {
      return response as number[][];
    }
    console.error(`Unexpected response format from model ${model}:`, response);
    return null;
  } catch (error) {
    console.error(`Error using model ${model}:`, error);
    return null;
  }
}

export async function compareDescriptions(desc1: string, desc2: string): Promise<number> {
  if (!desc1 || !desc2) {
    console.error('Invalid input: One or both descriptions are empty.');
    return 0;
  }

  console.log('Comparing descriptions:', desc1, desc2);

  const models = [
    'sentence-transformers/all-mpnet-base-v2',
  ];

  let similarities: number[] = [];
  for (const model of models) {
    const embeddings = await getEmbedding(model, [desc1, desc2]);
    if (embeddings) {
      const [vec1, vec2] = embeddings;
      const similarity = cosineSimilarity(vec1, vec2);
      similarities.push(similarity);
      console.log(`Similarity from ${model}:`, similarity);
    }
  }

  const avgSimilarity = similarities.length > 0 
    ? similarities.reduce((acc, val) => acc + val, 0) / similarities.length 
    : 0;

  console.log('Average similarity:', avgSimilarity);
  return avgSimilarity;
}



export async function enhancedSimilarity(text1: string, text2: string): Promise<number> {
  try {
    console.log('Enhanced similarity input:', text1, text2);
    if (!text1 || !text2) {
      console.error('Invalid text input for similarity comparison.');
      return 0;
    }

    const similarity = await compareDescriptions(text1, text2);
    console.log('Description similarity:', similarity);
    return similarity;
  } catch (error) {
    console.error('Error in enhanced similarity calculation:', error);
    return 0;
  }
}

function dateSimilarity(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const dayDiff = Math.abs((d1.getTime() - d2.getTime()) / (1000 * 3600 * 24));
  console.log('Date difference (days):', dayDiff);

  if (dayDiff === 0) return 1.0;
  if (dayDiff === 1) return 0.8;
  if (dayDiff === 2) return 0.6;
  if (dayDiff === 3) return 0.4;
  if (dayDiff === 4) return 0.2;
  return 0;
}


export async function compareLostAndFound(
  lostItem: any,
  foundItems: any[]
): Promise<{ id: any; score: number; breakdown: { [key: string]: number } }[]> {
  const results = [];

  if (!foundItems || foundItems.length === 0) {
    console.warn("No found items to compare.");
    return [];
  }

  for (const foundItem of foundItems) {
    let totalScore = 0;
    let breakdown: { [key: string]: number } = {};
    console.log('Lost item:', lostItem);
    console.log('Found item:', foundItem);

    
    if (lostItem.category === foundItem.category) {
      totalScore += 0.10;
      breakdown.category = 10;
    } else {
      breakdown.category = 0;
    }
    console.log(`Category: ${breakdown.category > 0 ? '100.00' : '0.00'}% out of 100%`);
    console.log(`${breakdown.category > 0 ? '100.00' : '0.00'}% is ${breakdown.category.toFixed(2)}%`);
    console.log(`100% would be ${FIELD_WEIGHTS.category}%`);

   
    const nameSimilarity = await enhancedSimilarity(
      lostItem.itemName,
      foundItem.itemName || foundItem.item
    );
    let nameScore = nameSimilarity < 0.1 ? 0 : nameSimilarity * 0.20;
    totalScore += nameScore;
    breakdown.itemName = nameScore * 100;
    console.log('Item name similarity score:', nameScore * 100, '%');
    console.log(`Item Name: ${(nameSimilarity * 100).toFixed(2)}% out of 100%`);
    console.log(`${(nameSimilarity * 100).toFixed(2)}% is ${(nameScore * 100).toFixed(2)}%`);
    console.log(`100% would be ${FIELD_WEIGHTS.itemName}%`);

    
    const locationSimilarity = await enhancedSimilarity(
      lostItem.location,
      foundItem.location
    );
    const locationScore = locationSimilarity * 0.20;
    totalScore += locationScore;
    breakdown.location = locationScore * 100;
    console.log('Location similarity score:', locationScore * 100, '%');
    console.log(`Location: ${(locationSimilarity * 100).toFixed(2)}% out of 100%`);
    console.log(`${(locationSimilarity * 100).toFixed(2)}% is ${(locationScore * 100).toFixed(2)}%`);
    console.log(`100% would be ${FIELD_WEIGHTS.location}%`);

    
    const dateSim = dateSimilarity(lostItem.date, foundItem.date);
    const dateScore = dateSim * 0.10;
    totalScore += dateScore;
    breakdown.date = dateScore * 100;
    console.log('Date similarity score:', dateScore * 100, '%');
    console.log(`Date: ${(dateSim * 100).toFixed(2)}% out of 100%`);
    console.log(`${(dateSim * 100).toFixed(2)}% is ${(dateScore * 100).toFixed(2)}%`);
    console.log(`100% would be ${FIELD_WEIGHTS.date}%`);

   
    let descriptionScore = 0;
    let rawDescPercent = 0;
    if (lostItem.description && foundItem.description) {
      const descSimilarity = await enhancedSimilarity(
        lostItem.description,
        foundItem.description
      );
      rawDescPercent = descSimilarity * 100;
      descriptionScore = descSimilarity * 0.40;
    }
    breakdown.description = descriptionScore * 100;
    totalScore += descriptionScore;
    console.log('Description similarity score:', descriptionScore * 100, '%');
    console.log(`Description: ${rawDescPercent.toFixed(2)}% out of 100%`);
    console.log(`${rawDescPercent.toFixed(2)}% is ${(descriptionScore * 100).toFixed(2)}%`);
    console.log(`100% would be ${FIELD_WEIGHTS.description}%`);

    

    results.push({
      id: foundItem.id || foundItem.id,
      score: totalScore * 100,
      breakdown,
    });
    console.log('Total similarity score:', totalScore * 100, '%');
  }


  results.sort((a, b) => b.score - a.score);

  const topCount = Math.min(results.length, 3);
  if (topCount === 0) {
    console.log('⚠️ No results to return after scoring.');
    return [];
  }

  console.log(`Top ${topCount} matches:`);
  for (let i = 0; i < topCount; i++) {
    const match = results[i];
    console.log(`Top ${i + 1}`);
    console.log(`Report ID: ${match.id}`);
    console.log(`Category - ${match.breakdown.category.toFixed(2)}%`);
    console.log(`Item Name - ${match.breakdown.itemName.toFixed(2)}%`);
    console.log(`Location - ${match.breakdown.location.toFixed(2)}%`);
    console.log(`Date - ${match.breakdown.date.toFixed(2)}%`);
    console.log(`Description - ${match.breakdown.description.toFixed(2)}%`);
    console.log(`Total Percentage Match: ${match.score.toFixed(2)}%`);
    console.log('----------------------------');
  }

  return results.slice(0, topCount);
}
