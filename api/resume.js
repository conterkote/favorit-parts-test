import { join } from 'node:path'
import { createResumeHandler } from '../server/resume.js'

export default createResumeHandler(join(process.cwd(), 'server/files/resume.pdf'))
