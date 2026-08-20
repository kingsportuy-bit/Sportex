[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("PrepareReference", "SelfTest", "Compare")]
  [string]$Mode,
  [string]$ConfigPath,
  [string]$ReferencePath,
  [string]$CandidatePath,
  [string]$CandidateManifestPath,
  [string]$ManifestPath,
  [string]$OutputDirectory
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($ConfigPath)) {
  $ConfigPath = Join-Path $PSScriptRoot "fixtures\whatsapp-tabs-visual.json"
}
if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
  $OutputDirectory = Join-Path (Split-Path $PSScriptRoot -Parent) ".sportex-local\whatsapp-tabs-visual\comparison"
}

$source = @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public sealed class SportexVisualImage
{
    public int Width { get; private set; }
    public int Height { get; private set; }
    public byte[] Red { get; private set; }
    public byte[] Green { get; private set; }
    public byte[] Blue { get; private set; }
    public byte[] Alpha { get; private set; }

    public SportexVisualImage(int width, int height)
    {
        if (width <= 0 || height <= 0) throw new ArgumentOutOfRangeException("image dimensions");
        Width = width;
        Height = height;
        int length = checked(width * height);
        Red = new byte[length];
        Green = new byte[length];
        Blue = new byte[length];
        Alpha = new byte[length];
        for (int index = 0; index < length; index++) Alpha[index] = 255;
    }
}

public sealed class SportexVisualComponent
{
    public int Area { get; set; }
    public int MinimumX { get; set; }
    public int MinimumY { get; set; }
    public int MaximumX { get; set; }
    public int MaximumY { get; set; }
}

public sealed class SportexHaloProfile
{
    public double PeakLuminance { get; set; }
    public double EffectiveRadius { get; set; }
    public double IntegratedArea { get; set; }
    public double Falloff { get; set; }
    public double CenterX { get; set; }
    public double CenterY { get; set; }
    public int SeedPixels { get; set; }
    public double Baseline { get; set; }
    public double[] DistanceBins { get; set; }
}

public sealed class SportexComparisonMetrics
{
    public double Ssim { get; set; }
    public double DeltaEMedian { get; set; }
    public double DeltaEPercentile95 { get; set; }
    public int ComparedPixels { get; set; }
    public int ExcludedPixels { get; set; }
    public int MismatchPixels { get; set; }
    public double MismatchFraction { get; set; }
    public int LargestComponentArea { get; set; }
    public List<SportexVisualComponent> Components { get; set; }
    public SportexHaloProfile ReferenceHalo { get; set; }
    public SportexHaloProfile CandidateHalo { get; set; }
    public double HaloCenterShift { get; set; }
}

public static class SportexVisualMetrics
{
    public static int[] GetDimensions(string path)
    {
        using (Bitmap bitmap = new Bitmap(path)) return new int[] { bitmap.Width, bitmap.Height };
    }

    public static SportexVisualImage Load(string path, int cropX, int cropY, int cropWidth, int cropHeight)
    {
        using (Bitmap source = new Bitmap(path))
        {
            if (cropWidth <= 0) cropWidth = source.Width;
            if (cropHeight <= 0) cropHeight = source.Height;
            if (cropX < 0 || cropY < 0 || cropX + cropWidth > source.Width || cropY + cropHeight > source.Height)
                throw new ArgumentOutOfRangeException("crop");
            using (Bitmap normalized = new Bitmap(cropWidth, cropHeight, PixelFormat.Format32bppArgb))
            {
                using (Graphics graphics = Graphics.FromImage(normalized))
                {
                    graphics.CompositingMode = CompositingMode.SourceCopy;
                    graphics.CompositingQuality = CompositingQuality.HighQuality;
                    graphics.InterpolationMode = InterpolationMode.NearestNeighbor;
                    graphics.PixelOffsetMode = PixelOffsetMode.Half;
                    graphics.SmoothingMode = SmoothingMode.None;
                    graphics.DrawImage(source, new Rectangle(0, 0, cropWidth, cropHeight),
                        new Rectangle(cropX, cropY, cropWidth, cropHeight), GraphicsUnit.Pixel);
                }
                return FromBitmap(normalized);
            }
        }
    }

    private static SportexVisualImage FromBitmap(Bitmap bitmap)
    {
        SportexVisualImage image = new SportexVisualImage(bitmap.Width, bitmap.Height);
        Rectangle rectangle = new Rectangle(0, 0, bitmap.Width, bitmap.Height);
        BitmapData data = bitmap.LockBits(rectangle, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        try
        {
            int stride = Math.Abs(data.Stride);
            byte[] bytes = new byte[stride * bitmap.Height];
            Marshal.Copy(data.Scan0, bytes, 0, bytes.Length);
            for (int y = 0; y < bitmap.Height; y++)
            {
                int row = data.Stride >= 0 ? y * stride : (bitmap.Height - 1 - y) * stride;
                for (int x = 0; x < bitmap.Width; x++)
                {
                    int sourceIndex = row + x * 4;
                    int targetIndex = y * bitmap.Width + x;
                    image.Blue[targetIndex] = bytes[sourceIndex];
                    image.Green[targetIndex] = bytes[sourceIndex + 1];
                    image.Red[targetIndex] = bytes[sourceIndex + 2];
                    image.Alpha[targetIndex] = bytes[sourceIndex + 3];
                }
            }
        }
        finally
        {
            bitmap.UnlockBits(data);
        }
        return image;
    }

    public static SportexVisualImage CreateSolid(int width, int height, byte red, byte green, byte blue)
    {
        SportexVisualImage image = new SportexVisualImage(width, height);
        for (int index = 0; index < image.Red.Length; index++)
        {
            image.Red[index] = red;
            image.Green[index] = green;
            image.Blue[index] = blue;
        }
        return image;
    }

    public static SportexVisualImage Copy(SportexVisualImage source)
    {
        SportexVisualImage copy = new SportexVisualImage(source.Width, source.Height);
        Array.Copy(source.Red, copy.Red, source.Red.Length);
        Array.Copy(source.Green, copy.Green, source.Green.Length);
        Array.Copy(source.Blue, copy.Blue, source.Blue.Length);
        Array.Copy(source.Alpha, copy.Alpha, source.Alpha.Length);
        return copy;
    }

    public static void SetPixel(SportexVisualImage image, int x, int y, byte red, byte green, byte blue)
    {
        if (x < 0 || y < 0 || x >= image.Width || y >= image.Height) throw new ArgumentOutOfRangeException("pixel");
        int index = y * image.Width + x;
        image.Red[index] = red;
        image.Green[index] = green;
        image.Blue[index] = blue;
        image.Alpha[index] = 255;
    }

    public static void SavePng(SportexVisualImage image, string path)
    {
        using (Bitmap bitmap = ToBitmap(image)) bitmap.Save(path, ImageFormat.Png);
    }

    private static Bitmap ToBitmap(SportexVisualImage image)
    {
        Bitmap bitmap = new Bitmap(image.Width, image.Height, PixelFormat.Format32bppArgb);
        Rectangle rectangle = new Rectangle(0, 0, image.Width, image.Height);
        BitmapData data = bitmap.LockBits(rectangle, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
        try
        {
            int stride = Math.Abs(data.Stride);
            byte[] bytes = new byte[stride * image.Height];
            for (int y = 0; y < image.Height; y++)
            {
                int row = data.Stride >= 0 ? y * stride : (image.Height - 1 - y) * stride;
                for (int x = 0; x < image.Width; x++)
                {
                    int sourceIndex = y * image.Width + x;
                    int targetIndex = row + x * 4;
                    bytes[targetIndex] = image.Blue[sourceIndex];
                    bytes[targetIndex + 1] = image.Green[sourceIndex];
                    bytes[targetIndex + 2] = image.Red[sourceIndex];
                    bytes[targetIndex + 3] = image.Alpha[sourceIndex];
                }
            }
            Marshal.Copy(bytes, 0, data.Scan0, bytes.Length);
        }
        finally
        {
            bitmap.UnlockBits(data);
        }
        return bitmap;
    }

    public static void SaveMask(byte[] mask, int width, int height, string path)
    {
        if (mask.Length != width * height) throw new ArgumentException("mask dimensions");
        SportexVisualImage image = CreateSolid(width, height, 0, 0, 0);
        for (int index = 0; index < mask.Length; index++)
        {
            byte value = mask[index] == 0 ? (byte)0 : (byte)255;
            image.Red[index] = value;
            image.Green[index] = value;
            image.Blue[index] = value;
        }
        SavePng(image, path);
    }

    public static byte[] LoadMask(string path, int expectedWidth, int expectedHeight)
    {
        SportexVisualImage image = Load(path, 0, 0, 0, 0);
        if (image.Width != expectedWidth || image.Height != expectedHeight) throw new ArgumentException("mask dimensions");
        byte[] mask = new byte[image.Width * image.Height];
        for (int index = 0; index < mask.Length; index++)
            mask[index] = image.Red[index] + image.Green[index] + image.Blue[index] >= 384 ? (byte)1 : (byte)0;
        return mask;
    }

    public static byte[] InvertMask(byte[] mask)
    {
        byte[] result = new byte[mask.Length];
        for (int index = 0; index < mask.Length; index++) result[index] = mask[index] == 0 ? (byte)1 : (byte)0;
        return result;
    }

    private static double EncodedLuminance(SportexVisualImage image, int index)
    {
        return 0.2126 * image.Red[index] + 0.7152 * image.Green[index] + 0.0722 * image.Blue[index];
    }

    private static double LinearChannel(byte value)
    {
        double encoded = value / 255.0;
        return encoded <= 0.04045 ? encoded / 12.92 : Math.Pow((encoded + 0.055) / 1.055, 2.4);
    }

    private static double RelativeLuminance(SportexVisualImage image, int index)
    {
        return 0.2126 * LinearChannel(image.Red[index])
            + 0.7152 * LinearChannel(image.Green[index])
            + 0.0722 * LinearChannel(image.Blue[index]);
    }

    public static double[] SrgbToLab(byte red, byte green, byte blue)
    {
        double linearRed = LinearChannel(red);
        double linearGreen = LinearChannel(green);
        double linearBlue = LinearChannel(blue);
        double x = (0.4124564 * linearRed + 0.3575761 * linearGreen + 0.1804375 * linearBlue) / 0.95047;
        double y = 0.2126729 * linearRed + 0.7151522 * linearGreen + 0.0721750 * linearBlue;
        double z = (0.0193339 * linearRed + 0.1191920 * linearGreen + 0.9503041 * linearBlue) / 1.08883;
        double fx = LabPivot(x);
        double fy = LabPivot(y);
        double fz = LabPivot(z);
        return new double[] { 116.0 * fy - 16.0, 500.0 * (fx - fy), 200.0 * (fy - fz) };
    }

    private static double LabPivot(double value)
    {
        double epsilon = 216.0 / 24389.0;
        double kappa = 24389.0 / 27.0;
        return value > epsilon ? Math.Pow(value, 1.0 / 3.0) : (kappa * value + 16.0) / 116.0;
    }

    private static double Degrees(double radians)
    {
        return radians * 180.0 / Math.PI;
    }

    private static double Radians(double degrees)
    {
        return degrees * Math.PI / 180.0;
    }

    private static double Hue(double a, double b)
    {
        if (a == 0.0 && b == 0.0) return 0.0;
        double value = Degrees(Math.Atan2(b, a));
        return value < 0.0 ? value + 360.0 : value;
    }

    public static double DeltaE2000(double[] first, double[] second)
    {
        if (first == null || second == null || first.Length != 3 || second.Length != 3) throw new ArgumentException("Lab triples required");
        double l1 = first[0];
        double a1 = first[1];
        double b1 = first[2];
        double l2 = second[0];
        double a2 = second[1];
        double b2 = second[2];
        double c1 = Math.Sqrt(a1 * a1 + b1 * b1);
        double c2 = Math.Sqrt(a2 * a2 + b2 * b2);
        double averageC = (c1 + c2) / 2.0;
        double averageC7 = Math.Pow(averageC, 7.0);
        double g = 0.5 * (1.0 - Math.Sqrt(averageC7 / (averageC7 + Math.Pow(25.0, 7.0))));
        double adjustedA1 = (1.0 + g) * a1;
        double adjustedA2 = (1.0 + g) * a2;
        double adjustedC1 = Math.Sqrt(adjustedA1 * adjustedA1 + b1 * b1);
        double adjustedC2 = Math.Sqrt(adjustedA2 * adjustedA2 + b2 * b2);
        double adjustedH1 = Hue(adjustedA1, b1);
        double adjustedH2 = Hue(adjustedA2, b2);
        double deltaL = l2 - l1;
        double deltaC = adjustedC2 - adjustedC1;
        double hueDifference;
        if (adjustedC1 * adjustedC2 == 0.0) hueDifference = 0.0;
        else if (Math.Abs(adjustedH2 - adjustedH1) <= 180.0) hueDifference = adjustedH2 - adjustedH1;
        else if (adjustedH2 <= adjustedH1) hueDifference = adjustedH2 - adjustedH1 + 360.0;
        else hueDifference = adjustedH2 - adjustedH1 - 360.0;
        double deltaH = 2.0 * Math.Sqrt(adjustedC1 * adjustedC2) * Math.Sin(Radians(hueDifference / 2.0));
        double averageL = (l1 + l2) / 2.0;
        double averageAdjustedC = (adjustedC1 + adjustedC2) / 2.0;
        double averageH;
        if (adjustedC1 * adjustedC2 == 0.0) averageH = adjustedH1 + adjustedH2;
        else if (Math.Abs(adjustedH1 - adjustedH2) <= 180.0) averageH = (adjustedH1 + adjustedH2) / 2.0;
        else if (adjustedH1 + adjustedH2 < 360.0) averageH = (adjustedH1 + adjustedH2 + 360.0) / 2.0;
        else averageH = (adjustedH1 + adjustedH2 - 360.0) / 2.0;
        double t = 1.0
            - 0.17 * Math.Cos(Radians(averageH - 30.0))
            + 0.24 * Math.Cos(Radians(2.0 * averageH))
            + 0.32 * Math.Cos(Radians(3.0 * averageH + 6.0))
            - 0.20 * Math.Cos(Radians(4.0 * averageH - 63.0));
        double deltaTheta = 30.0 * Math.Exp(-Math.Pow((averageH - 275.0) / 25.0, 2.0));
        double averageAdjustedC7 = Math.Pow(averageAdjustedC, 7.0);
        double rotation = -2.0 * Math.Sqrt(averageAdjustedC7 / (averageAdjustedC7 + Math.Pow(25.0, 7.0))) * Math.Sin(Radians(2.0 * deltaTheta));
        double lightnessScale = 1.0 + 0.015 * Math.Pow(averageL - 50.0, 2.0) / Math.Sqrt(20.0 + Math.Pow(averageL - 50.0, 2.0));
        double chromaScale = 1.0 + 0.045 * averageAdjustedC;
        double hueScale = 1.0 + 0.015 * averageAdjustedC * t;
        double lightnessTerm = deltaL / lightnessScale;
        double chromaTerm = deltaC / chromaScale;
        double hueTerm = deltaH / hueScale;
        return Math.Sqrt(lightnessTerm * lightnessTerm + chromaTerm * chromaTerm + hueTerm * hueTerm + rotation * chromaTerm * hueTerm);
    }

    public static byte[] BuildAntiAliasMask(SportexVisualImage reference, int neighborhoodRadius, double luminanceRangeMinimum, double endpointDistance, int dilationRadius)
    {
        if (neighborhoodRadius < 1 || dilationRadius < 0) throw new ArgumentOutOfRangeException("mask radius");
        byte[] mask = new byte[reference.Width * reference.Height];
        for (int y = neighborhoodRadius; y < reference.Height - neighborhoodRadius; y++)
        {
            for (int x = neighborhoodRadius; x < reference.Width - neighborhoodRadius; x++)
            {
                double minimum = 255.0;
                double maximum = 0.0;
                for (int offsetY = -neighborhoodRadius; offsetY <= neighborhoodRadius; offsetY++)
                {
                    for (int offsetX = -neighborhoodRadius; offsetX <= neighborhoodRadius; offsetX++)
                    {
                        double value = EncodedLuminance(reference, (y + offsetY) * reference.Width + x + offsetX);
                        if (value < minimum) minimum = value;
                        if (value > maximum) maximum = value;
                    }
                }
                int index = y * reference.Width + x;
                double center = EncodedLuminance(reference, index);
                if (maximum - minimum >= luminanceRangeMinimum
                    && center > minimum + endpointDistance
                    && center < maximum - endpointDistance) mask[index] = 1;
            }
        }
        if (dilationRadius == 0) return mask;
        byte[] dilated = new byte[mask.Length];
        for (int y = 0; y < reference.Height; y++)
        {
            for (int x = 0; x < reference.Width; x++)
            {
                if (mask[y * reference.Width + x] == 0) continue;
                for (int offsetY = -dilationRadius; offsetY <= dilationRadius; offsetY++)
                {
                    int targetY = y + offsetY;
                    if (targetY < 0 || targetY >= reference.Height) continue;
                    for (int offsetX = -dilationRadius; offsetX <= dilationRadius; offsetX++)
                    {
                        int targetX = x + offsetX;
                        if (targetX >= 0 && targetX < reference.Width) dilated[targetY * reference.Width + targetX] = 1;
                    }
                }
            }
        }
        return dilated;
    }

    public static double ComputeSsim(SportexVisualImage reference, SportexVisualImage candidate, byte[] exclusionMask,
        int windowSize, double sigma, double k1, double k2)
    {
        EnsureSameDimensions(reference, candidate, exclusionMask);
        if (windowSize < 3 || windowSize % 2 == 0 || sigma <= 0.0) throw new ArgumentOutOfRangeException("SSIM window");
        int radius = windowSize / 2;
        double[,] kernel = new double[windowSize, windowSize];
        double kernelTotal = 0.0;
        for (int y = -radius; y <= radius; y++)
        {
            for (int x = -radius; x <= radius; x++)
            {
                double weight = Math.Exp(-(x * x + y * y) / (2.0 * sigma * sigma));
                kernel[y + radius, x + radius] = weight;
                kernelTotal += weight;
            }
        }
        for (int y = 0; y < windowSize; y++)
            for (int x = 0; x < windowSize; x++) kernel[y, x] /= kernelTotal;
        double c1 = Math.Pow(k1 * 255.0, 2.0);
        double c2 = Math.Pow(k2 * 255.0, 2.0);
        double total = 0.0;
        int centers = 0;
        for (int centerY = radius; centerY < reference.Height - radius; centerY++)
        {
            for (int centerX = radius; centerX < reference.Width - radius; centerX++)
            {
                if (exclusionMask[centerY * reference.Width + centerX] != 0) continue;
                double weightSum = 0.0;
                double meanReference = 0.0;
                double meanCandidate = 0.0;
                for (int offsetY = -radius; offsetY <= radius; offsetY++)
                {
                    for (int offsetX = -radius; offsetX <= radius; offsetX++)
                    {
                        int index = (centerY + offsetY) * reference.Width + centerX + offsetX;
                        if (exclusionMask[index] != 0) continue;
                        double weight = kernel[offsetY + radius, offsetX + radius];
                        weightSum += weight;
                        meanReference += weight * EncodedLuminance(reference, index);
                        meanCandidate += weight * EncodedLuminance(candidate, index);
                    }
                }
                if (weightSum <= 0.0) continue;
                meanReference /= weightSum;
                meanCandidate /= weightSum;
                double varianceReference = 0.0;
                double varianceCandidate = 0.0;
                double covariance = 0.0;
                for (int offsetY = -radius; offsetY <= radius; offsetY++)
                {
                    for (int offsetX = -radius; offsetX <= radius; offsetX++)
                    {
                        int index = (centerY + offsetY) * reference.Width + centerX + offsetX;
                        if (exclusionMask[index] != 0) continue;
                        double weight = kernel[offsetY + radius, offsetX + radius] / weightSum;
                        double referenceDifference = EncodedLuminance(reference, index) - meanReference;
                        double candidateDifference = EncodedLuminance(candidate, index) - meanCandidate;
                        varianceReference += weight * referenceDifference * referenceDifference;
                        varianceCandidate += weight * candidateDifference * candidateDifference;
                        covariance += weight * referenceDifference * candidateDifference;
                    }
                }
                double numerator = (2.0 * meanReference * meanCandidate + c1) * (2.0 * covariance + c2);
                double denominator = (meanReference * meanReference + meanCandidate * meanCandidate + c1)
                    * (varianceReference + varianceCandidate + c2);
                total += denominator == 0.0 ? 1.0 : numerator / denominator;
                centers++;
            }
        }
        if (centers == 0) throw new InvalidOperationException("SSIM has no unmasked centers");
        return total / centers;
    }

    private static void EnsureSameDimensions(SportexVisualImage reference, SportexVisualImage candidate, byte[] mask)
    {
        if (reference.Width != candidate.Width || reference.Height != candidate.Height) throw new ArgumentException("image dimensions differ");
        if (mask == null || mask.Length != reference.Width * reference.Height) throw new ArgumentException("mask dimensions differ");
    }

    private static double Percentile(List<double> values, double percentile)
    {
        if (values.Count == 0) throw new InvalidOperationException("empty percentile");
        values.Sort();
        if (percentile == 0.5 && values.Count % 2 == 0)
            return (values[values.Count / 2 - 1] + values[values.Count / 2]) / 2.0;
        int index = Math.Max(0, Math.Min(values.Count - 1, (int)Math.Ceiling(percentile * values.Count) - 1));
        return values[index];
    }

    public static List<SportexVisualComponent> ConnectedComponents(byte[] mask, int width, int height)
    {
        if (mask == null || mask.Length != width * height) throw new ArgumentException("mask dimensions");
        bool[] visited = new bool[mask.Length];
        List<SportexVisualComponent> components = new List<SportexVisualComponent>();
        Queue<int> queue = new Queue<int>();
        for (int index = 0; index < mask.Length; index++)
        {
            if (mask[index] == 0 || visited[index]) continue;
            visited[index] = true;
            queue.Enqueue(index);
            SportexVisualComponent component = new SportexVisualComponent
            {
                MinimumX = width,
                MinimumY = height,
                MaximumX = 0,
                MaximumY = 0,
                Area = 0
            };
            while (queue.Count > 0)
            {
                int current = queue.Dequeue();
                int x = current % width;
                int y = current / width;
                component.Area++;
                if (x < component.MinimumX) component.MinimumX = x;
                if (x > component.MaximumX) component.MaximumX = x;
                if (y < component.MinimumY) component.MinimumY = y;
                if (y > component.MaximumY) component.MaximumY = y;
                for (int offsetY = -1; offsetY <= 1; offsetY++)
                {
                    for (int offsetX = -1; offsetX <= 1; offsetX++)
                    {
                        if (offsetX == 0 && offsetY == 0) continue;
                        int targetX = x + offsetX;
                        int targetY = y + offsetY;
                        if (targetX < 0 || targetY < 0 || targetX >= width || targetY >= height) continue;
                        int target = targetY * width + targetX;
                        if (mask[target] == 0 || visited[target]) continue;
                        visited[target] = true;
                        queue.Enqueue(target);
                    }
                }
            }
            components.Add(component);
        }
        components.Sort(delegate(SportexVisualComponent left, SportexVisualComponent right) { return right.Area.CompareTo(left.Area); });
        return components;
    }

    private static double GreenExcess(SportexVisualImage image, int index)
    {
        return image.Green[index] - (image.Red[index] + image.Blue[index]) / 2.0;
    }

    public static byte[] BuildHaloSeedMask(SportexVisualImage image, int regionX, int regionY, int regionWidth, int regionHeight,
        double greenExcessMinimum, double luminanceMinimum)
    {
        if (regionX < 0 || regionY < 0 || regionWidth <= 0 || regionHeight <= 0
            || regionX + regionWidth > image.Width || regionY + regionHeight > image.Height) throw new ArgumentOutOfRangeException("halo region");
        byte[] threshold = new byte[image.Width * image.Height];
        for (int y = regionY; y < regionY + regionHeight; y++)
        {
            for (int x = regionX; x < regionX + regionWidth; x++)
            {
                int index = y * image.Width + x;
                if (GreenExcess(image, index) >= greenExcessMinimum && EncodedLuminance(image, index) >= luminanceMinimum)
                    threshold[index] = 1;
            }
        }
        bool[] visited = new bool[threshold.Length];
        List<int> best = new List<int>();
        Queue<int> queue = new Queue<int>();
        for (int y = regionY; y < regionY + regionHeight; y++)
        {
            for (int x = regionX; x < regionX + regionWidth; x++)
            {
                int start = y * image.Width + x;
                if (threshold[start] == 0 || visited[start]) continue;
                List<int> component = new List<int>();
                visited[start] = true;
                queue.Enqueue(start);
                while (queue.Count > 0)
                {
                    int current = queue.Dequeue();
                    component.Add(current);
                    int currentX = current % image.Width;
                    int currentY = current / image.Width;
                    for (int offsetY = -1; offsetY <= 1; offsetY++)
                    {
                        for (int offsetX = -1; offsetX <= 1; offsetX++)
                        {
                            if (offsetX == 0 && offsetY == 0) continue;
                            int targetX = currentX + offsetX;
                            int targetY = currentY + offsetY;
                            if (targetX < regionX || targetY < regionY || targetX >= regionX + regionWidth || targetY >= regionY + regionHeight) continue;
                            int target = targetY * image.Width + targetX;
                            if (threshold[target] == 0 || visited[target]) continue;
                            visited[target] = true;
                            queue.Enqueue(target);
                        }
                    }
                }
                if (component.Count > best.Count) best = component;
            }
        }
        if (best.Count == 0) throw new InvalidOperationException("halo seed not found");
        byte[] seed = new byte[threshold.Length];
        foreach (int index in best) seed[index] = 1;
        return seed;
    }

    public static SportexHaloProfile ComputeHaloProfile(SportexVisualImage image, byte[] distanceSeed, byte[] centerSeed,
        int regionX, int regionY, int regionWidth, int regionHeight, double maximumDistance,
        double baselineDistanceMinimum, double baselineDistanceMaximum, double minimumSignal)
    {
        if (distanceSeed.Length != image.Width * image.Height || centerSeed.Length != distanceSeed.Length) throw new ArgumentException("halo seed dimensions");
        List<int> seedIndices = new List<int>();
        for (int y = regionY; y < regionY + regionHeight; y++)
            for (int x = regionX; x < regionX + regionWidth; x++)
                if (distanceSeed[y * image.Width + x] != 0) seedIndices.Add(y * image.Width + x);
        if (seedIndices.Count == 0) throw new InvalidOperationException("empty distance seed");
        int regionLength = regionWidth * regionHeight;
        double[] distances = new double[regionLength];
        double[] rawSignals = new double[regionLength];
        List<double> baselineValues = new List<double>();
        for (int localY = 0; localY < regionHeight; localY++)
        {
            for (int localX = 0; localX < regionWidth; localX++)
            {
                int x = regionX + localX;
                int y = regionY + localY;
                double minimumSquared = Double.MaxValue;
                foreach (int seedIndex in seedIndices)
                {
                    int seedX = seedIndex % image.Width;
                    int seedY = seedIndex / image.Width;
                    double squared = (x - seedX) * (x - seedX) + (y - seedY) * (y - seedY);
                    if (squared < minimumSquared) minimumSquared = squared;
                }
                int localIndex = localY * regionWidth + localX;
                double distance = Math.Sqrt(minimumSquared);
                distances[localIndex] = distance;
                int imageIndex = y * image.Width + x;
                rawSignals[localIndex] = Math.Max(0.0, GreenExcess(image, imageIndex) / 255.0);
                if (distance >= baselineDistanceMinimum && distance <= baselineDistanceMaximum)
                    baselineValues.Add(rawSignals[localIndex]);
            }
        }
        double baseline = 0.0;
        if (baselineValues.Count > 0)
        {
            foreach (double value in baselineValues) baseline += value;
            baseline /= baselineValues.Count;
        }
        int binCount = (int)Math.Ceiling(maximumDistance) + 1;
        double[] binTotals = new double[binCount];
        int[] binSamples = new int[binCount];
        double integratedArea = 0.0;
        double weightedRadius = 0.0;
        for (int index = 0; index < regionLength; index++)
        {
            double distance = distances[index];
            if (distance > maximumDistance) continue;
            double signal = Math.Max(0.0, rawSignals[index] - baseline);
            if (signal < minimumSignal) signal = 0.0;
            integratedArea += signal;
            weightedRadius += distance * signal;
            int bin = Math.Min(binCount - 1, (int)Math.Floor(distance + 0.5));
            binTotals[bin] += signal;
            binSamples[bin]++;
        }
        double[] bins = new double[binCount];
        for (int index = 0; index < bins.Length; index++) bins[index] = binSamples[index] == 0 ? 0.0 : binTotals[index] / binSamples[index];
        List<double> regressionX = new List<double>();
        List<double> regressionY = new List<double>();
        for (int index = 1; index < bins.Length; index++)
        {
            if (bins[index] <= 0.0) continue;
            regressionX.Add(index);
            regressionY.Add(Math.Log(bins[index] + minimumSignal));
        }
        double slope = 0.0;
        if (regressionX.Count >= 2)
        {
            double meanX = 0.0;
            double meanY = 0.0;
            for (int index = 0; index < regressionX.Count; index++)
            {
                meanX += regressionX[index];
                meanY += regressionY[index];
            }
            meanX /= regressionX.Count;
            meanY /= regressionY.Count;
            double numerator = 0.0;
            double denominator = 0.0;
            for (int index = 0; index < regressionX.Count; index++)
            {
                numerator += (regressionX[index] - meanX) * (regressionY[index] - meanY);
                denominator += (regressionX[index] - meanX) * (regressionX[index] - meanX);
            }
            slope = denominator == 0.0 ? 0.0 : numerator / denominator;
        }
        double peakLuminance = 0.0;
        double centerX = 0.0;
        double centerY = 0.0;
        int centerPixels = 0;
        for (int y = regionY; y < regionY + regionHeight; y++)
        {
            for (int x = regionX; x < regionX + regionWidth; x++)
            {
                int index = y * image.Width + x;
                if (distanceSeed[index] != 0)
                {
                    double luminance = RelativeLuminance(image, index);
                    if (luminance > peakLuminance) peakLuminance = luminance;
                }
                if (centerSeed[index] != 0)
                {
                    centerX += x;
                    centerY += y;
                    centerPixels++;
                }
            }
        }
        if (centerPixels == 0) throw new InvalidOperationException("empty center seed");
        return new SportexHaloProfile
        {
            PeakLuminance = peakLuminance,
            EffectiveRadius = integratedArea == 0.0 ? 0.0 : weightedRadius / integratedArea,
            IntegratedArea = integratedArea,
            Falloff = Math.Max(0.0, -slope),
            CenterX = centerX / centerPixels,
            CenterY = centerY / centerPixels,
            SeedPixels = centerPixels,
            Baseline = baseline,
            DistanceBins = bins
        };
    }

    public static SportexComparisonMetrics Compare(SportexVisualImage reference, SportexVisualImage candidate,
        byte[] antiAliasMask, byte[] haloSeed, int ssimWindowSize, double ssimSigma, double ssimK1, double ssimK2,
        double componentPixelThreshold, int haloRegionX, int haloRegionY, int haloRegionWidth, int haloRegionHeight,
        double haloSeedGreenExcessMinimum, double haloSeedLuminanceMinimum, double haloMaximumDistance,
        double haloBaselineDistanceMinimum, double haloBaselineDistanceMaximum, double haloMinimumSignal)
    {
        EnsureSameDimensions(reference, candidate, antiAliasMask);
        if (haloSeed == null || haloSeed.Length != antiAliasMask.Length) throw new ArgumentException("halo seed dimensions");
        List<double> differences = new List<double>();
        byte[] mismatchMask = new byte[antiAliasMask.Length];
        int excluded = 0;
        int mismatch = 0;
        for (int index = 0; index < antiAliasMask.Length; index++)
        {
            if (antiAliasMask[index] != 0)
            {
                excluded++;
                continue;
            }
            double[] referenceLab = SrgbToLab(reference.Red[index], reference.Green[index], reference.Blue[index]);
            double[] candidateLab = SrgbToLab(candidate.Red[index], candidate.Green[index], candidate.Blue[index]);
            double difference = DeltaE2000(referenceLab, candidateLab);
            differences.Add(difference);
            if (difference > componentPixelThreshold)
            {
                mismatchMask[index] = 1;
                mismatch++;
            }
        }
        List<SportexVisualComponent> components = ConnectedComponents(mismatchMask, reference.Width, reference.Height);
        byte[] candidateSeed = BuildHaloSeedMask(candidate, haloRegionX, haloRegionY, haloRegionWidth, haloRegionHeight,
            haloSeedGreenExcessMinimum, haloSeedLuminanceMinimum);
        SportexHaloProfile referenceHalo = ComputeHaloProfile(reference, haloSeed, haloSeed,
            haloRegionX, haloRegionY, haloRegionWidth, haloRegionHeight, haloMaximumDistance,
            haloBaselineDistanceMinimum, haloBaselineDistanceMaximum, haloMinimumSignal);
        SportexHaloProfile candidateHalo = ComputeHaloProfile(candidate, haloSeed, candidateSeed,
            haloRegionX, haloRegionY, haloRegionWidth, haloRegionHeight, haloMaximumDistance,
            haloBaselineDistanceMinimum, haloBaselineDistanceMaximum, haloMinimumSignal);
        double centerShift = Math.Sqrt(Math.Pow(referenceHalo.CenterX - candidateHalo.CenterX, 2.0)
            + Math.Pow(referenceHalo.CenterY - candidateHalo.CenterY, 2.0));
        return new SportexComparisonMetrics
        {
            Ssim = ComputeSsim(reference, candidate, antiAliasMask, ssimWindowSize, ssimSigma, ssimK1, ssimK2),
            DeltaEMedian = Percentile(differences, 0.5),
            DeltaEPercentile95 = Percentile(differences, 0.95),
            ComparedPixels = differences.Count,
            ExcludedPixels = excluded,
            MismatchPixels = mismatch,
            MismatchFraction = differences.Count == 0 ? 1.0 : mismatch / (double)differences.Count,
            LargestComponentArea = components.Count == 0 ? 0 : components[0].Area,
            Components = components,
            ReferenceHalo = referenceHalo,
            CandidateHalo = candidateHalo,
            HaloCenterShift = centerShift
        };
    }

    public static void SaveDiagnostics(SportexVisualImage reference, SportexVisualImage candidate, byte[] antiAliasMask,
        double componentPixelThreshold, string diffPath, string overlayPath)
    {
        EnsureSameDimensions(reference, candidate, antiAliasMask);
        SportexVisualImage difference = CreateSolid(reference.Width, reference.Height, 0, 0, 0);
        SportexVisualImage overlay = CreateSolid(reference.Width, reference.Height, 0, 0, 0);
        for (int index = 0; index < antiAliasMask.Length; index++)
        {
            overlay.Red[index] = (byte)((reference.Red[index] + candidate.Red[index]) / 2);
            overlay.Green[index] = (byte)((reference.Green[index] + candidate.Green[index]) / 2);
            overlay.Blue[index] = (byte)((reference.Blue[index] + candidate.Blue[index]) / 2);
            if (antiAliasMask[index] != 0)
            {
                difference.Red[index] = 26;
                difference.Green[index] = 72;
                difference.Blue[index] = 132;
                continue;
            }
            double delta = DeltaE2000(
                SrgbToLab(reference.Red[index], reference.Green[index], reference.Blue[index]),
                SrgbToLab(candidate.Red[index], candidate.Green[index], candidate.Blue[index]));
            double ratio = Math.Min(1.0, delta / Math.Max(componentPixelThreshold * 2.0, 0.000001));
            difference.Red[index] = (byte)Math.Round(255.0 * ratio);
            difference.Green[index] = (byte)Math.Round(255.0 * Math.Max(0.0, 1.0 - Math.Abs(ratio - 0.5) * 2.0));
            difference.Blue[index] = 0;
        }
        SavePng(difference, diffPath);
        SavePng(overlay, overlayPath);
    }
}
'@

if (-not ("SportexVisualMetrics" -as [type])) {
  Add-Type -TypeDefinition $source -ReferencedAssemblies @("System.Drawing")
}

function Get-AbsolutePath {
  param([Parameter(Mandatory = $true)][string]$Path)
  return (Resolve-Path -LiteralPath $Path).Path
}

function Get-Sha256 {
  param([Parameter(Mandatory = $true)][string]$Path)
  return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Get-PngChunks {
  param([Parameter(Mandatory = $true)][string]$Path)
  $bytes = [System.IO.File]::ReadAllBytes($Path)
  if ($bytes.Length -lt 8) { throw "PNG inválido: $Path" }
  $signature = @(137, 80, 78, 71, 13, 10, 26, 10)
  for ($index = 0; $index -lt $signature.Count; $index++) {
    if ($bytes[$index] -ne $signature[$index]) { throw "Firma PNG inválida: $Path" }
  }
  $chunks = [System.Collections.Generic.List[string]]::new()
  $offset = 8
  $foundEnd = $false
  while ($offset + 12 -le $bytes.Length) {
    $length = [int64]$bytes[$offset] * 16777216L `
      + [int64]$bytes[$offset + 1] * 65536L `
      + [int64]$bytes[$offset + 2] * 256L `
      + [int64]$bytes[$offset + 3]
    if ($length -gt [int]::MaxValue -or $offset + 12L + $length -gt $bytes.Length) {
      throw "Chunk PNG fuera de límites en offset $offset`: $Path"
    }
    $type = [System.Text.Encoding]::ASCII.GetString($bytes, $offset + 4, 4)
    if ($type -notmatch '^[A-Za-z]{4}$') { throw "Tipo de chunk PNG inválido en offset $offset`: $Path" }
    $chunks.Add($type)
    $offset = [int]($offset + 12L + $length)
    if ($type -eq "IEND") {
      $foundEnd = $true
      break
    }
  }
  if (-not $foundEnd) { throw "PNG sin chunk IEND: $Path" }
  if ($offset -ne $bytes.Length) { throw "PNG con bytes posteriores a IEND: $Path" }
  return @($chunks)
}

function Get-Config {
  $absolute = Get-AbsolutePath -Path $ConfigPath
  $config = Get-Content -LiteralPath $absolute -Raw | ConvertFrom-Json
  if ($config.'$schema' -ne "sportex.whatsapp-tabs-visual-fixture.v1") { throw "Fixture visual incompatible" }
  return [pscustomobject]@{ Path = $absolute; Sha256 = Get-Sha256 -Path $absolute; Value = $config }
}

function Assert-ReferenceSeal {
  param(
    [Parameter(Mandatory = $true)]$ConfigRecord,
    [Parameter(Mandatory = $true)]$Config,
    [Parameter(Mandatory = $true)][string]$ReferenceManifestAbsolutePath
  )
  $projectRoot = Split-Path $PSScriptRoot -Parent
  $sealPath = Get-AbsolutePath -Path (Join-Path $projectRoot ([string]$Config.reference.sealManifestPath))
  $seal = Get-Content -LiteralPath $sealPath -Raw | ConvertFrom-Json
  if ([int]$seal.schemaVersion -ne 1 -or [string]$seal.authority -ne "user_supplied_target" -or -not [bool]$seal.sealedBeforeUiEdit) {
    throw "El manifiesto raíz de referencia no está sellado"
  }
  foreach ($property in @("x", "y", "width", "height")) {
    if ([int]$seal.canonicalCrop.roi.$property -ne [int]$Config.reference.crop.$property) {
      throw "El crop del sello raíz no coincide con el fixture: $property"
    }
  }
  $requiredArtifacts = @("plan", "fixture", "comparator", "e2eHarness", "referenceManifest", "reference", "geometryMask", "antiAliasingMask", "haloMask")
  $verified = [ordered]@{}
  foreach ($name in $requiredArtifacts) {
    $property = $seal.sealedArtifacts.PSObject.Properties[$name]
    if (-not $property) { throw "Falta artefacto sellado: $name" }
    $entry = $property.Value
    if ([string]::IsNullOrWhiteSpace([string]$entry.path) -or [string]$entry.sha256 -notmatch '^[a-f0-9]{64}$') {
      throw "Artefacto sellado inválido: $name"
    }
    $artifactPath = Get-AbsolutePath -Path (Join-Path $projectRoot ([string]$entry.path))
    $actualHash = Get-Sha256 -Path $artifactPath
    if ($actualHash -ne [string]$entry.sha256) { throw "Artefacto modificado después del sellado: $name" }
    $verified[$name] = [ordered]@{ path = $artifactPath; sha256 = $actualHash }
  }
  if ($verified.fixture.path -ne $ConfigRecord.Path) { throw "El sello raíz apunta a otro fixture" }
  if ($verified.comparator.path -ne $PSCommandPath) { throw "El sello raíz apunta a otro comparador" }
  $expectedE2e = Get-AbsolutePath -Path (Join-Path $projectRoot "scripts\e2e-whatsapp-tabs-visual.mjs")
  if ($verified.e2eHarness.path -ne $expectedE2e) { throw "El sello raíz apunta a otro E2E" }
  if ($verified.referenceManifest.path -ne $ReferenceManifestAbsolutePath) { throw "El sello raíz apunta a otro manifiesto preparado" }
  $preparedReference = Get-AbsolutePath -Path (Join-Path $projectRoot ([string]$Config.reference.preparedPath))
  if ($verified.reference.path -ne $preparedReference -or $verified.reference.sha256 -ne [string]$Config.reference.preparedSha256) {
    throw "La referencia preparada no coincide con el sello raíz"
  }
  return [pscustomobject]@{ Path = $sealPath; Sha256 = Get-Sha256 -Path $sealPath; Verified = $verified }
}

function Convert-Components {
  param([Parameter(Mandatory = $true)]$Components)
  return @($Components | ForEach-Object {
    [ordered]@{
      area = $_.Area
      bounds = [ordered]@{
        x = $_.MinimumX
        y = $_.MinimumY
        width = $_.MaximumX - $_.MinimumX + 1
        height = $_.MaximumY - $_.MinimumY + 1
      }
    }
  })
}

function Get-RelativeDifference {
  param([double]$Reference, [double]$Candidate)
  if ([double]::IsNaN($Reference) -or [double]::IsNaN($Candidate) -or [double]::IsInfinity($Reference) -or [double]::IsInfinity($Candidate)) {
    return [double]::PositiveInfinity
  }
  if ([math]::Abs($Reference) -lt 0.000000001) { return [math]::Abs($Candidate - $Reference) }
  return [math]::Abs($Candidate - $Reference) / [math]::Abs($Reference)
}

function Invoke-SelfTest {
  $vectors = @(
    @(50.0000, 2.6772, -79.7751, 50.0000, 0.0000, -82.7485, 2.0425),
    @(50.0000, 3.1571, -77.2803, 50.0000, 0.0000, -82.7485, 2.8615),
    @(50.0000, 2.8361, -74.0200, 50.0000, 0.0000, -82.7485, 3.4412),
    @(50.0000, -1.3802, -84.2814, 50.0000, 0.0000, -82.7485, 1.0000),
    @(50.0000, -1.1848, -84.8006, 50.0000, 0.0000, -82.7485, 1.0000),
    @(50.0000, -0.9009, -85.5211, 50.0000, 0.0000, -82.7485, 1.0000),
    @(50.0000, 0.0000, 0.0000, 50.0000, -1.0000, 2.0000, 2.3669),
    @(50.0000, -1.0000, 2.0000, 50.0000, 0.0000, 0.0000, 2.3669),
    @(50.0000, 2.4900, -0.0010, 50.0000, -2.4900, 0.0009, 7.1792),
    @(50.0000, 2.4900, -0.0010, 50.0000, -2.4900, 0.0010, 7.1792),
    @(50.0000, 2.4900, -0.0010, 50.0000, -2.4900, 0.0011, 7.2195),
    @(50.0000, 2.4900, -0.0010, 50.0000, -2.4900, 0.0012, 7.2195),
    @(50.0000, -0.0010, 2.4900, 50.0000, 0.0009, -2.4900, 4.8045),
    @(50.0000, -0.0010, 2.4900, 50.0000, 0.0010, -2.4900, 4.8045),
    @(50.0000, -0.0010, 2.4900, 50.0000, 0.0011, -2.4900, 4.7461),
    @(50.0000, -0.0010, 2.4900, 50.0000, 0.0012, -2.4900, 4.7461),
    @(50.0000, 2.5000, 0.0000, 50.0000, 0.0000, -2.5000, 4.3065),
    @(50.0000, 2.5000, 0.0000, 73.0000, 25.0000, -18.0000, 27.1492),
    @(50.0000, 2.5000, 0.0000, 61.0000, -5.0000, 29.0000, 22.8977),
    @(50.0000, 2.5000, 0.0000, 56.0000, -27.0000, -3.0000, 31.9030),
    @(50.0000, 2.5000, 0.0000, 58.0000, 24.0000, 15.0000, 19.4535),
    @(50.0000, 2.5000, 0.0000, 50.0000, 3.1736, 0.5854, 1.0000),
    @(50.0000, 2.5000, 0.0000, 50.0000, 3.2972, 0.0000, 1.0000),
    @(50.0000, 2.5000, 0.0000, 50.0000, 1.8634, 0.5757, 1.0000),
    @(50.0000, 2.5000, 0.0000, 50.0000, 3.2592, 0.3350, 1.0000),
    @(60.2574, -34.0099, 36.2677, 60.4626, -34.1751, 39.4387, 1.2644),
    @(63.0109, -31.0961, -5.8663, 62.8187, -29.7946, -4.0864, 1.2630),
    @(61.2901, 3.7196, -5.3901, 61.4292, 2.2480, -4.9620, 1.8731),
    @(35.0831, -44.1164, 3.7933, 35.0232, -40.0716, 1.5901, 1.8645),
    @(22.7233, 20.0904, -46.6940, 23.0331, 14.9730, -42.5619, 2.0373),
    @(36.4612, 47.8580, 18.3852, 36.2715, 50.5065, 21.2231, 1.4146),
    @(90.8027, -2.0831, 1.4410, 91.1528, -1.6435, 0.0447, 1.4441),
    @(90.9257, -0.5406, -0.9208, 88.6381, -0.8985, -0.7239, 1.5381),
    @(6.7747, -0.2908, -2.4247, 5.8714, -0.0985, -2.2286, 0.6377)
  )
  $maximumError = 0.0
  $vectorResults = foreach ($vector in $vectors) {
    $first = [double[]]@($vector[0], $vector[1], $vector[2])
    $second = [double[]]@($vector[3], $vector[4], $vector[5])
    $actual = [SportexVisualMetrics]::DeltaE2000($first, $second)
    $error = [math]::Abs($actual - $vector[6])
    if ($error -gt $maximumError) { $maximumError = $error }
    [ordered]@{ expected = $vector[6]; actual = $actual; error = $error }
  }
  if ($maximumError -gt 0.0001) { throw "CIEDE2000 self-test excedió 1e-4: $maximumError" }

  $white = [SportexVisualMetrics]::SrgbToLab(255, 255, 255)
  if ([math]::Abs($white[0] - 100.0) -gt 0.0001 -or [math]::Abs($white[1]) -gt 0.0001 -or [math]::Abs($white[2]) -gt 0.0001) {
    throw "sRGB->Lab self-test falló para blanco"
  }

  $reference = [SportexVisualMetrics]::CreateSolid(21, 21, 16, 24, 18)
  $candidate = [SportexVisualMetrics]::Copy($reference)
  $emptyMask = New-Object byte[] (21 * 21)
  $identicalSsim = [SportexVisualMetrics]::ComputeSsim($reference, $candidate, $emptyMask, 11, 1.5, 0.01, 0.03)
  if ([math]::Abs($identicalSsim - 1.0) -gt 0.000000000001) { throw "SSIM idéntico no devolvió 1" }
  [SportexVisualMetrics]::SetPixel($candidate, 10, 10, 220, 220, 220)
  $changedSsim = [SportexVisualMetrics]::ComputeSsim($reference, $candidate, $emptyMask, 11, 1.5, 0.01, 0.03)
  if ($changedSsim -ge 1.0) { throw "SSIM sintético no detectó cambio" }

  $componentMask = New-Object byte[] 9
  $componentMask[0] = 1
  $componentMask[4] = 1
  $componentMask[8] = 1
  $components = [SportexVisualMetrics]::ConnectedComponents($componentMask, 3, 3)
  if ($components.Count -ne 1 -or $components[0].Area -ne 3) { throw "Componentes 8-conexas fallaron" }

  $edge = [SportexVisualMetrics]::CreateSolid(5, 5, 0, 0, 0)
  for ($y = 0; $y -lt 5; $y++) {
    [SportexVisualMetrics]::SetPixel($edge, 2, $y, 128, 128, 128)
    [SportexVisualMetrics]::SetPixel($edge, 3, $y, 255, 255, 255)
    [SportexVisualMetrics]::SetPixel($edge, 4, $y, 255, 255, 255)
  }
  $antiAliasMask = [SportexVisualMetrics]::BuildAntiAliasMask($edge, 1, 8.0, 1.5, 0)
  if ($antiAliasMask[2 + 2 * 5] -ne 1) { throw "Máscara AA reference-only no detectó el píxel intermedio" }

  $haloImage = [SportexVisualMetrics]::CreateSolid(41, 41, 15, 20, 17)
  for ($y = 0; $y -lt 41; $y++) {
    for ($x = 0; $x -lt 41; $x++) {
      $distance = [math]::Sqrt([math]::Pow($x - 20, 2) + [math]::Pow($y - 20, 2))
      if ($distance -le 10) {
        $addition = [byte][math]::Round(100 * [math]::Exp(-$distance / 4.0))
        [SportexVisualMetrics]::SetPixel($haloImage, $x, $y, 15, ([byte][math]::Min(255, 20 + $addition)), 17)
      }
    }
  }
  $haloSeed = New-Object byte[] (41 * 41)
  $haloSeed[20 + 20 * 41] = 1
  $haloProfile = [SportexVisualMetrics]::ComputeHaloProfile($haloImage, $haloSeed, $haloSeed, 0, 0, 41, 41, 18, 14, 18, 0.000001)
  if ($haloProfile.IntegratedArea -le 0 -or $haloProfile.EffectiveRadius -le 0 -or $haloProfile.SeedPixels -ne 1) {
    throw "Perfil sintético de halo falló"
  }

  $result = [ordered]@{
    ok = $true
    mode = "SelfTest"
    ciede2000 = [ordered]@{
      source = "Sharma, Wu and Dalal 2005 supplementary test data"
      vectors = $vectorResults.Count
      maximumAbsoluteError = $maximumError
      tolerance = 0.0001
    }
    srgbToLabWhite = @($white)
    ssim = [ordered]@{ identical = $identicalSsim; changed = $changedSsim; window = 11; sigma = 1.5 }
    connectivity8 = [ordered]@{ components = $components.Count; area = $components[0].Area }
    antiAliasReferenceOnly = [ordered]@{ detected = [int]$antiAliasMask[2 + 2 * 5] }
    halo = [ordered]@{
      effectiveRadius = $haloProfile.EffectiveRadius
      integratedArea = $haloProfile.IntegratedArea
      falloff = $haloProfile.Falloff
    }
  }
  $result | ConvertTo-Json -Depth 12
}

function Invoke-PrepareReference {
  $configRecord = Get-Config
  $config = $configRecord.Value
  $sourcePath = if ($ReferencePath) { Get-AbsolutePath -Path $ReferencePath } else { Get-AbsolutePath -Path ([string]$config.reference.sourcePath) }
  $sourceHash = Get-Sha256 -Path $sourcePath
  if ($sourceHash -ne [string]$config.reference.sourceSha256) { throw "Hash de referencia inesperado: $sourceHash" }
  $dimensions = [SportexVisualMetrics]::GetDimensions($sourcePath)
  if ($dimensions[0] -ne [int]$config.reference.sourceWidth -or $dimensions[1] -ne [int]$config.reference.sourceHeight) {
    throw "Dimensiones de referencia inesperadas: $($dimensions[0])x$($dimensions[1])"
  }
  New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
  $crop = $config.reference.crop
  $referenceImage = [SportexVisualMetrics]::Load($sourcePath, [int]$crop.x, [int]$crop.y, [int]$crop.width, [int]$crop.height)
  $referenceArtifact = Join-Path $OutputDirectory "reference-tabs.png"
  $antiAliasArtifact = Join-Path $OutputDirectory "reference-aa-exclusion-mask.png"
  $strictArtifact = Join-Path $OutputDirectory "reference-strict-inclusion-mask.png"
  $haloArtifact = Join-Path $OutputDirectory "reference-halo-seed-mask.png"
  [SportexVisualMetrics]::SavePng($referenceImage, $referenceArtifact)
  $antiAlias = $config.comparison.antiAliasing
  $antiAliasMask = [SportexVisualMetrics]::BuildAntiAliasMask(
    $referenceImage,
    [int]$antiAlias.neighborhoodRadius,
    [double]$antiAlias.luminanceRangeMinimum,
    [double]$antiAlias.endpointDistance,
    [int]$antiAlias.dilationRadius
  )
  $halo = $config.comparison.halo
  $haloSeed = [SportexVisualMetrics]::BuildHaloSeedMask(
    $referenceImage,
    [int]$halo.region.x,
    [int]$halo.region.y,
    [int]$halo.region.width,
    [int]$halo.region.height,
    [double]$halo.seedGreenExcessMinimum,
    [double]$halo.seedLuminanceMinimum
  )
  [SportexVisualMetrics]::SaveMask($antiAliasMask, $referenceImage.Width, $referenceImage.Height, $antiAliasArtifact)
  [SportexVisualMetrics]::SaveMask([SportexVisualMetrics]::InvertMask($antiAliasMask), $referenceImage.Width, $referenceImage.Height, $strictArtifact)
  [SportexVisualMetrics]::SaveMask($haloSeed, $referenceImage.Width, $referenceImage.Height, $haloArtifact)
  $manifestOutput = if ($ManifestPath) { $ManifestPath } else { Join-Path $OutputDirectory "reference-manifest.json" }
  $chunks = Get-PngChunks -Path $sourcePath
  $declaredColorChunks = @($chunks | Where-Object { $_ -in @("sRGB", "iCCP", "gAMA") })
  if ([string]$config.reference.colorSpace -eq "untagged_assumed_sRGB" -and $declaredColorChunks.Count -ne 0) {
    throw "La referencia declarada untagged contiene metadata de color: $($declaredColorChunks -join ', ')"
  }
  $preparedChunks = Get-PngChunks -Path $referenceArtifact
  $preparedColorChunks = @($preparedChunks | Where-Object { $_ -in @("sRGB", "iCCP", "gAMA") })
  if ($preparedColorChunks -contains "iCCP") { throw "El artefacto preparado contiene un perfil ICC inesperado" }
  if ($preparedColorChunks -notcontains "sRGB") { throw "El artefacto preparado no declara sRGB" }
  $manifest = [ordered]@{
    schema = "sportex.whatsapp-tabs-visual-reference.v1"
    status = "REFERENCE_PREPARED_AND_SEALED"
    preparedAtUtc = [DateTime]::UtcNow.ToString("o")
    fixture = [ordered]@{
      path = "scripts/fixtures/$([System.IO.Path]::GetFileName($configRecord.Path))"
      sha256 = $configRecord.Sha256
      id = $config.fixtureId
    }
    source = [ordered]@{
      fileName = [System.IO.Path]::GetFileName($sourcePath)
      sha256 = $sourceHash
      width = $dimensions[0]
      height = $dimensions[1]
      pngChunks = $chunks
      declaredColorChunks = $declaredColorChunks
      colorSpace = [string]$config.reference.colorSpace
      metadataPolicy = "source_untagged_assumed_sRGB; prepared_artifact_reencoded_as_sRGB_without_copying_source_metadata"
    }
    crop = [ordered]@{ x = [int]$crop.x; y = [int]$crop.y; width = [int]$crop.width; height = [int]$crop.height }
    preparedPngChunks = $preparedChunks
    preparedColorChunks = $preparedColorChunks
    algorithms = $config.comparison
    artifacts = [ordered]@{
      reference = [ordered]@{ file = [System.IO.Path]::GetFileName($referenceArtifact); sha256 = Get-Sha256 -Path $referenceArtifact }
      antiAliasExclusionMask = [ordered]@{ file = [System.IO.Path]::GetFileName($antiAliasArtifact); sha256 = Get-Sha256 -Path $antiAliasArtifact }
      strictInclusionMask = [ordered]@{ file = [System.IO.Path]::GetFileName($strictArtifact); sha256 = Get-Sha256 -Path $strictArtifact }
      haloSeedMask = [ordered]@{ file = [System.IO.Path]::GetFileName($haloArtifact); sha256 = Get-Sha256 -Path $haloArtifact }
    }
  }
  $manifest | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $manifestOutput -Encoding UTF8
  [ordered]@{
    ok = $true
    mode = "PrepareReference"
    status = $manifest.status
    manifest = (Resolve-Path -LiteralPath $manifestOutput).Path
    manifestSha256 = Get-Sha256 -Path $manifestOutput
    artifacts = $manifest.artifacts
  } | ConvertTo-Json -Depth 12
}

function Resolve-CandidateManifest {
  param([Parameter(Mandatory = $true)][string]$CandidateAbsolutePath)
  if ($CandidateManifestPath) { return Get-AbsolutePath -Path $CandidateManifestPath }
  $directory = Split-Path $CandidateAbsolutePath -Parent
  for ($depth = 0; $depth -lt 3; $depth++) {
    $candidate = Join-Path $directory "candidate-manifest.json"
    if (Test-Path -LiteralPath $candidate) { return (Resolve-Path -LiteralPath $candidate).Path }
    $parent = Split-Path $directory -Parent
    if ($parent -eq $directory) { break }
    $directory = $parent
  }
  throw "No se encontró candidate-manifest.json; comparación abortada"
}

function Get-ComparisonImage {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)]$Config
  )
  $dimensions = [SportexVisualMetrics]::GetDimensions($Path)
  $crop = $Config.reference.crop
  if ($dimensions[0] -eq [int]$crop.width -and $dimensions[1] -eq [int]$crop.height) {
    return [SportexVisualMetrics]::Load($Path, 0, 0, 0, 0)
  }
  if ($dimensions[0] -eq [int]$Config.reference.sourceWidth -and $dimensions[1] -eq [int]$Config.reference.sourceHeight) {
    return [SportexVisualMetrics]::Load($Path, [int]$crop.x, [int]$crop.y, [int]$crop.width, [int]$crop.height)
  }
  throw "La imagen no coincide con viewport ni crop sellados: $($dimensions[0])x$($dimensions[1])"
}

function Invoke-Compare {
  if (-not $CandidatePath) { throw "Compare requiere -CandidatePath" }
  $configRecord = Get-Config
  $config = $configRecord.Value
  $candidateAbsolutePath = Get-AbsolutePath -Path $CandidatePath
  $candidateManifestAbsolutePath = Resolve-CandidateManifest -CandidateAbsolutePath $candidateAbsolutePath
  $candidateManifest = Get-Content -LiteralPath $candidateManifestAbsolutePath -Raw | ConvertFrom-Json
  if ($candidateManifest.schema -ne "sportex.whatsapp-tabs-visual-candidate.v1") { throw "Manifest de candidato incompatible" }
  if ($candidateManifest.status -ne "CANDIDATE_READY_FOR_COMPARISON") { throw "El candidato no está listo para comparación" }
  if (-not $candidateManifest.coldStable -or @($candidateManifest.coldHashes).Count -ne 3 -or @($candidateManifest.coldHashes | Select-Object -Unique).Count -ne 1) {
    throw "El candidato no demuestra tres procesos fríos estables"
  }
  if ([int]$candidateManifest.unexpectedRequestCount -ne 0 -or [int]$candidateManifest.consoleErrorCount -ne 0) {
    throw "El candidato contiene requests inesperados o errores de consola"
  }
  if ([string]$candidateManifest.fixture.sha256 -ne $configRecord.Sha256) { throw "El candidato usa otro fixture" }
  if ([string]$candidateManifest.reference.sourceSha256 -ne [string]$config.reference.sourceSha256) { throw "El candidato usa otra referencia" }
  foreach ($property in @("x", "y", "width", "height")) {
    if ([int]$candidateManifest.reference.crop.$property -ne [int]$config.reference.crop.$property) { throw "El candidato usa otro crop" }
  }
  $candidateHash = Get-Sha256 -Path $candidateAbsolutePath
  if (@($candidateManifest.coldHashes) -notcontains $candidateHash) { throw "CandidatePath no pertenece a las capturas frías selladas" }

  $manifestAbsolutePath = if ($ManifestPath) { Get-AbsolutePath -Path $ManifestPath } else { Get-AbsolutePath -Path (Join-Path $OutputDirectory "reference-manifest.json") }
  $referenceSeal = Assert-ReferenceSeal -ConfigRecord $configRecord -Config $config -ReferenceManifestAbsolutePath $manifestAbsolutePath
  $referenceManifest = Get-Content -LiteralPath $manifestAbsolutePath -Raw | ConvertFrom-Json
  if ($referenceManifest.schema -ne "sportex.whatsapp-tabs-visual-reference.v1") { throw "Manifest de referencia incompatible" }
  if ([string]$referenceManifest.fixture.sha256 -ne $configRecord.Sha256) { throw "Fixture modificado después de sellar máscaras" }
  $artifactDirectory = Split-Path $manifestAbsolutePath -Parent
  $referenceArtifact = Join-Path $artifactDirectory ([string]$referenceManifest.artifacts.reference.file)
  $antiAliasArtifact = Join-Path $artifactDirectory ([string]$referenceManifest.artifacts.antiAliasExclusionMask.file)
  $haloArtifact = Join-Path $artifactDirectory ([string]$referenceManifest.artifacts.haloSeedMask.file)
  $strictArtifact = Join-Path $artifactDirectory ([string]$referenceManifest.artifacts.strictInclusionMask.file)
  $sealedArtifacts = @(
    [pscustomobject]@{ Path = $referenceArtifact; Sha256 = [string]$referenceManifest.artifacts.reference.sha256 },
    [pscustomobject]@{ Path = $antiAliasArtifact; Sha256 = [string]$referenceManifest.artifacts.antiAliasExclusionMask.sha256 },
    [pscustomobject]@{ Path = $strictArtifact; Sha256 = [string]$referenceManifest.artifacts.strictInclusionMask.sha256 },
    [pscustomobject]@{ Path = $haloArtifact; Sha256 = [string]$referenceManifest.artifacts.haloSeedMask.sha256 }
  )
  foreach ($artifact in $sealedArtifacts) {
    if ((Get-Sha256 -Path $artifact.Path) -ne $artifact.Sha256) { throw "Artefacto sellado modificado: $($artifact.Path)" }
  }

  $referenceImage = Get-ComparisonImage -Path $referenceArtifact -Config $config
  $candidateImage = Get-ComparisonImage -Path $candidateAbsolutePath -Config $config
  $antiAliasMask = [SportexVisualMetrics]::LoadMask($antiAliasArtifact, $referenceImage.Width, $referenceImage.Height)
  $haloSeed = [SportexVisualMetrics]::LoadMask($haloArtifact, $referenceImage.Width, $referenceImage.Height)
  $ssim = $config.comparison.ssim
  $delta = $config.comparison.deltaE00
  $halo = $config.comparison.halo
  $metrics = [SportexVisualMetrics]::Compare(
    $referenceImage,
    $candidateImage,
    $antiAliasMask,
    $haloSeed,
    [int]$ssim.windowSize,
    [double]$ssim.sigma,
    [double]$ssim.k1,
    [double]$ssim.k2,
    [double]$delta.componentPixelThreshold,
    [int]$halo.region.x,
    [int]$halo.region.y,
    [int]$halo.region.width,
    [int]$halo.region.height,
    [double]$halo.seedGreenExcessMinimum,
    [double]$halo.seedLuminanceMinimum,
    [double]$halo.maximumDistance,
    [double]$halo.baselineDistanceMinimum,
    [double]$halo.baselineDistanceMaximum,
    [double]$halo.minimumSignal
  )
  $peakDifference = Get-RelativeDifference -Reference $metrics.ReferenceHalo.PeakLuminance -Candidate $metrics.CandidateHalo.PeakLuminance
  $radiusDifference = Get-RelativeDifference -Reference $metrics.ReferenceHalo.EffectiveRadius -Candidate $metrics.CandidateHalo.EffectiveRadius
  $areaDifference = Get-RelativeDifference -Reference $metrics.ReferenceHalo.IntegratedArea -Candidate $metrics.CandidateHalo.IntegratedArea
  $falloffDifference = Get-RelativeDifference -Reference $metrics.ReferenceHalo.Falloff -Candidate $metrics.CandidateHalo.Falloff
  $failures = [System.Collections.Generic.List[string]]::new()
  if ($metrics.Ssim -lt [double]$ssim.minimum) { $failures.Add("SSIM") }
  if ($metrics.DeltaEMedian -gt [double]$delta.medianMaximum) { $failures.Add("DELTA_E_MEDIAN") }
  if ($metrics.DeltaEPercentile95 -gt [double]$delta.percentile95Maximum) { $failures.Add("DELTA_E_P95") }
  if ($metrics.MismatchFraction -gt [double]$config.comparison.components.mismatchFractionMaximum) { $failures.Add("MISMATCH_FRACTION") }
  if ($metrics.LargestComponentArea -gt [int]$config.comparison.components.largestAreaMaximum) { $failures.Add("CONNECTED_COMPONENT") }
  if ($peakDifference -gt [double]$halo.peakLuminanceRelativeTolerance) { $failures.Add("HALO_PEAK") }
  if ($radiusDifference -gt [double]$halo.effectiveRadiusRelativeTolerance) { $failures.Add("HALO_RADIUS") }
  if ($areaDifference -gt [double]$halo.integratedAreaRelativeTolerance) { $failures.Add("HALO_AREA") }
  if ($falloffDifference -gt [double]$halo.falloffRelativeTolerance) { $failures.Add("HALO_FALLOFF") }
  if ($metrics.HaloCenterShift -gt [double]$halo.centerShiftMaximumPixels) { $failures.Add("HALO_CENTER") }
  New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
  $diffPath = Join-Path $OutputDirectory "candidate-diff.png"
  $overlayPath = Join-Path $OutputDirectory "candidate-overlay.png"
  [SportexVisualMetrics]::SaveDiagnostics($referenceImage, $candidateImage, $antiAliasMask, [double]$delta.componentPixelThreshold, $diffPath, $overlayPath)
  $result = [ordered]@{
    ok = $failures.Count -eq 0
    mode = "Compare"
    status = if ($failures.Count -eq 0) { "CANDIDATE_READY_FOR_FITO_REVIEW" } else { "FAIL_CLOSED" }
    strictState = [string]$config.reference.strictState
    fixture = [ordered]@{ path = $configRecord.Path; sha256 = $configRecord.Sha256 }
    reference = [ordered]@{ manifest = $manifestAbsolutePath; artifact = $referenceArtifact; sha256 = Get-Sha256 -Path $referenceArtifact }
    referenceSeal = [ordered]@{ manifest = $referenceSeal.Path; sha256 = $referenceSeal.Sha256 }
    candidate = [ordered]@{ manifest = $candidateManifestAbsolutePath; artifact = $candidateAbsolutePath; sha256 = $candidateHash }
    thresholds = $config.comparison
    metrics = [ordered]@{
      ssim = $metrics.Ssim
      deltaE00 = [ordered]@{ median = $metrics.DeltaEMedian; percentile95 = $metrics.DeltaEPercentile95 }
      pixels = [ordered]@{
        compared = $metrics.ComparedPixels
        antiAliasExcluded = $metrics.ExcludedPixels
        mismatch = $metrics.MismatchPixels
        mismatchFraction = $metrics.MismatchFraction
      }
      connectedComponents = [ordered]@{
        connectivity = 8
        largestArea = $metrics.LargestComponentArea
        values = Convert-Components -Components $metrics.Components
      }
      halo = [ordered]@{
        reference = $metrics.ReferenceHalo
        candidate = $metrics.CandidateHalo
        relativeDifference = [ordered]@{
          peakLuminance = $peakDifference
          effectiveRadius = $radiusDifference
          integratedArea = $areaDifference
          falloff = $falloffDifference
        }
        centerShiftPixels = $metrics.HaloCenterShift
      }
    }
    failures = @($failures)
    artifacts = [ordered]@{
      diff = [ordered]@{ path = $diffPath; sha256 = Get-Sha256 -Path $diffPath }
      overlay = [ordered]@{ path = $overlayPath; sha256 = Get-Sha256 -Path $overlayPath }
    }
  }
  $resultPath = Join-Path $OutputDirectory "comparison-result.json"
  $result | ConvertTo-Json -Depth 30 | Set-Content -LiteralPath $resultPath -Encoding UTF8
  $result | ConvertTo-Json -Depth 30
  if ($failures.Count -ne 0) { exit 1 }
}

switch ($Mode) {
  "SelfTest" { Invoke-SelfTest }
  "PrepareReference" { Invoke-PrepareReference }
  "Compare" { Invoke-Compare }
}
