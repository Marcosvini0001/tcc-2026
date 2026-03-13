import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  nome: string;
  email: string;
  senha: string;
  xp: number;
  nivel: number;
  amigos: mongoose.Types.ObjectId[];
  tarefasConcluidas: mongoose.Types.ObjectId[];
}

const userSchema = new Schema<IUser>({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  xp: { type: Number, default: 0 },
  nivel: { type: Number, default: 1 },
  amigos: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  tarefasConcluidas: [{ type: Schema.Types.ObjectId, ref: 'TaskHistory' }],
});

export default mongoose.model<IUser>('User', userSchema);