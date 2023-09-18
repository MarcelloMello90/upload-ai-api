import { FastifyInstance } from "fastify";
import { createReadStream } from "fs";
import { z } from 'zod'
import { prisma } from "../lib/prisma";
import { openai } from "../lib/openai";

export async function createTranscriptionRoute(app: FastifyInstance) {
  app.post('/videos/:videoId/transcription', async (req) => {
    const paramsSchema = z.object({
      videoId: z.string().uuid(),
    })
    
    const { videoId } = paramsSchema.parse(req.params)

    const bodySchema = z.object({
      prompt: z.string(),
    })

    const {prompt } = bodySchema.parse(req.body)

    // transcriçao do audio
    const video = await prisma.video.findUniqueOrThrow({
      where: {
        id: videoId,
      }
    })

    // local onde o video foi salvo
    const videoPath = video.path

    // transcriçao do audio
    const audioReadStream = createReadStream(videoPath)

    const response = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: 'whisper-1',
      language: 'fr',
      response_format: 'json',
      temperature: 0,
      prompt,
    })

    const transcription = response.text

    await prisma.video.update({
      where: {
        id: videoId,
      },
      data: {
        transcription
      },
    })

    return { transcription }
  })
}