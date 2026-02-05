export const optimizeCode = (code: string): { optimizedCode: string; savings: number; framework: 'PyTorch' | 'TensorFlow' | 'Hugging Face' | 'Unknown' } => {
    let optimizedCode = code;
    let framework: 'PyTorch' | 'TensorFlow' | 'Hugging Face' | 'Unknown' = 'Unknown';
    let savings = 0;

    // 1. Detect Framework
    if (code.includes('Trainer') || code.includes('TrainingArguments') || code.includes('BertFor') || code.includes('transformers')) {
        framework = 'Hugging Face';
    } else if (code.includes('torch') || code.includes('nn.Module') || code.includes('backward()')) {
        framework = 'PyTorch';
    } else if (code.includes('tensorflow') || code.includes('tf.') || code.includes('keras')) {
        framework = 'TensorFlow';
    }

    // 2. Apply Optimizations
    if (framework === 'Hugging Face') {
        // Logic for HF Trainer
        // Look for TrainingArguments and inject fp16=True
        if (optimizedCode.includes('TrainingArguments')) {
            // Case 1: TrainingArguments(...) call exists
            if (!optimizedCode.includes('fp16=True') && !optimizedCode.includes('bf16=True')) {
                optimizedCode = optimizedCode.replace(
                    /TrainingArguments\s*\(/,
                    'TrainingArguments(fp16=True, # GreenGen Mixed Precision ⚡\n    '
                );
            }
        } else {
            // Case 2: Implicit or missing args, append tip
            optimizedCode += '\n\n# GreenGen Tip 🌿: Pass `fp16=True` to TrainingArguments for ~40% energy savings.';
        }

        savings = parseFloat((Math.random() * (45 - 25) + 25).toFixed(1)); // 25.0 - 45.0%

    } else if (framework === 'PyTorch') {
        // A. Add Imports if missing
        if (!code.includes('from torch.cuda.amp import GradScaler')) {
            const importLine = "from torch.cuda.amp import GradScaler, autocast # GreenGen Added 🌿";
            // Insert after last import or at top
            const lastImportIdx = Math.max(code.lastIndexOf('import '), code.lastIndexOf('from '));
            if (lastImportIdx !== -1) {
                const endOfImportLine = code.indexOf('\n', lastImportIdx);
                optimizedCode = optimizedCode.slice(0, endOfImportLine + 1) + importLine + '\n' + optimizedCode.slice(endOfImportLine + 1);
            } else {
                optimizedCode = importLine + '\n' + optimizedCode;
            }
        }

        // B. Inject GradScaler initialization
        // Find where optimizer is defined or model is defined
        const optimizerMatch = optimizedCode.match(/optimizer\s*=\s*.*$/m);
        if (optimizerMatch) {
            const insertIdx = optimizerMatch.index! + optimizerMatch[0].length;
            optimizedCode = optimizedCode.slice(0, insertIdx) + '\nscaler = GradScaler() # GreenGen Mixed Precision ⚡' + optimizedCode.slice(insertIdx);
        }

        // C. Wrap Forward Pass with autocast
        // Heuristic: Find 'output = model(...)' or similar. This is tricky with simple regex.
        // We'll look for the line calculating loss or output and wrap it.
        // Simplifying: Find `loss =` and wrap the lines before it.
        const lossMatch = optimizedCode.match(/^\s*loss\s*=\s*.+$/m);
        if (lossMatch) {
            const indentation = lossMatch[0].match(/^\s*/)?.[0] || '';
            const lineStart = lossMatch.index!;
            // Look back for output calculation? 
            // For simplicity in this v1, checking for common pattern `output = model(input)`
            const outputMatch = optimizedCode.match(/^\s*output\s*=\s*.*$/m);

            if (outputMatch && outputMatch.index! < lossMatch.index!) {
                // Wrap from output to loss
                const blockStart = outputMatch.index!;
                const blockEnd = lineStart + lossMatch[0].length;
                const blockContent = optimizedCode.substring(blockStart, blockEnd);

                // Indent the block
                const indentedBlock = blockContent.split('\n').map(l => indentation + '    ' + l.trim()).join('\n');

                const wrapper = `${indentation}with autocast(): # GreenGen AMP Context\n${indentedBlock}`;
                optimizedCode = optimizedCode.substring(0, blockStart) + wrapper + optimizedCode.substring(blockEnd);
            }
        }

        // D. Modify Backward Pass and Step
        // 1. loss.backward() -> scaler.scale(loss).backward()
        optimizedCode = optimizedCode.replace(/loss\.backward\(\)/g, 'scaler.scale(loss).backward() # Scaled Gradient');

        // 2. optimizer.step() -> scaler.step(optimizer); scaler.update()
        optimizedCode = optimizedCode.replace(/optimizer\.step\(\)/g, 'scaler.step(optimizer)\n    scaler.update() # Update Scaler');

        savings = parseFloat((Math.random() * (55 - 35) + 35).toFixed(1)); // 35.0 - 55.0%

    } else if (framework === 'TensorFlow') {
        // A. XLA Compilation (jit_compile=True)
        if (optimizedCode.includes('model.compile(')) {
            if (!optimizedCode.includes('jit_compile')) {
                optimizedCode = optimizedCode.replace(
                    /model\.compile\(([^)]+)\)/,
                    'model.compile($1, jit_compile=True) # GreenGen XLA Enabled 🚀'
                );
            }
        } else {
            optimizedCode += '\n\n# GreenGen Tip: Enable XLA with model.compile(..., jit_compile=True)';
        }

        savings = parseFloat((Math.random() * (40 - 20) + 20).toFixed(1)); // 20.0 - 40.0%

    } else {
        // Unknown Framework
        optimizedCode += `\n\n# GreenGen Analysis 🌿
# Could not auto-detect framework.
# Recommendations:
# 1. Use Mixed Precision (FP16) where possible.
# 2. Batch your data efficiently.
# 3. Use specialized accelerators (TPU/GPU).`;
        savings = parseFloat((Math.random() * (15 - 5) + 5).toFixed(1)); // 5.0 - 15.0%
    }

    return { optimizedCode, savings, framework };
};
