import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class ImageValidationService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  /**
   * Validate if an uploaded image contains a car
   * @param file The uploaded file buffer
   * @returns Promise<boolean> True if image contains a car, false otherwise
   */
  async validateCarImage(file: Express.Multer.File): Promise<{ isValid: boolean; reason?: string }> {
    try {
      // Convert buffer to base64
      const base64Image = file.buffer.toString('base64');
      
      // Prepare the image part for Gemini
      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: file.mimetype,
        },
      };

      // Create a detailed prompt for car detection
      const prompt = `Analyze this image carefully and determine if it contains a car, automobile, or vehicle.
      
Requirements:
- The image must show at least one complete or partial car/automobile/vehicle
- Acceptable: cars, trucks, SUVs, vans, motorcycles, any motorized vehicles
- Not acceptable: bicycles, toys, car parts alone, drawings/sketches of cars (unless photorealistic)

Respond in JSON format with:
{
  "isCar": true/false,
  "confidence": "high/medium/low",
  "description": "brief description of what you see"
}`;

      // Generate content with the image
      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      // Parse the JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format from Gemini API');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      if (!analysis.isCar) {
        return {
          isValid: false,
          reason: `Image validation failed: ${analysis.description}. Please upload an actual car image.`,
        };
      }

      // Return success if it's a car
      return {
        isValid: true,
      };

    } catch (error) {
      console.error('Error validating car image with Gemini:', error);
      
      // If Gemini API fails, we should decide whether to allow or reject
      // For production, you might want to allow uploads when API fails
      // For strict validation, throw an error
      throw new BadRequestException(
        'Unable to validate image. Please try again or contact support.',
      );
    }
  }

  /**
   * Validate car image and throw exception if invalid
   * @param file The uploaded file
   */
  async validateCarImageOrThrow(file: Express.Multer.File): Promise<void> {
    const validation = await this.validateCarImage(file);
    
    if (!validation.isValid) {
      throw new BadRequestException(validation.reason);
    }
  }
}
