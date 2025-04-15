import { supabase } from './supabase';

interface MathpixResponse {
  text: string;
  latex_styled?: string;
  confidence: number;
}

export async function processMathWithMathpix(imageData: string): Promise<MathpixResponse | null> {
  try {
    // Remove data URL prefix if present
    const base64Image = imageData.replace(/^data:image\/[a-z]+;base64,/, '');

    // Call Mathpix through Edge Function
    const { data: response, error } = await supabase.functions.invoke('mathpix', {
      body: { image: base64Image }
    });

    if (error) {
      console.error('Error calling Mathpix:', error);
      return null;
    }

    return response;
  } catch (error) {
    console.error('Error processing math with Mathpix:', error);
    return null;
  }
}