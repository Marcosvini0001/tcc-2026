import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  titulo: string;
  descricao: string;
  xp: number;
  icone: string;
}

const taskSchema = new Schema<ITask>({
  titulo: { type: String, required: true },
  descricao: { type: String, required: true },
  xp: { type: Number, required: true },
  icone: { type: String, required: true },
});

export default mongoose.model<ITask>('Task', taskSchema);