

## Fix: Remove zoom-in animation from comparator

**Problem**: The comparator container has `animate-in zoom-in-95` class which creates a zoom-in effect when the comparison view appears.

**Solution**: Remove the `zoom-in-95` animation class from the comparator wrapper div (line 108) so images display at their natural scale, filling the container with `object-cover` without any zoom animation distortion.

**Change**: In `src/components/fachadista/ComparatorView.tsx`, line 108:
- Change `animate-in zoom-in-95 duration-500` → `animate-in fade-in duration-500`

This keeps a subtle fade-in entrance but eliminates the zoom scaling effect that makes images appear to "zoom in".

