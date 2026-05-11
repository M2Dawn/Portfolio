// Article content for "Getting Started with Revit API Development"
const articleContent = `
  <p>
    The Revit API opens up endless possibilities for automating workflows, creating custom tools, and extending Revit's functionality. Whether you're a BIM manager looking to streamline processes or a developer wanting to build commercial plugins, this guide will walk you through the fundamentals of Revit API development.
  </p>

  <h2>Prerequisites</h2>
  <p>Before diving into Revit API development, ensure you have the following:</p>
  <ul>
    <li><strong>Autodesk Revit</strong> installed (2020 or later recommended)</li>
    <li><strong>Visual Studio</strong> (Community Edition is free and sufficient)</li>
    <li><strong>Basic C# knowledge</strong> - understanding of classes, methods, and object-oriented programming</li>
    <li><strong>.NET Framework</strong> - Revit 2020-2023 uses .NET Framework 4.8</li>
    <li><strong>Revit API documentation</strong> - Available from Autodesk Developer Network</li>
  </ul>

  <div class="info-box">
    <h4>Pro Tip</h4>
    <p>Install the Revit SDK (Software Development Kit) which includes sample code, documentation, and useful utilities. You can download it from the Autodesk Developer Network.</p>
  </div>

  <h2>Understanding the Revit API Architecture</h2>
  <p>
    The Revit API is built on a hierarchical structure that mirrors the organization of a Revit project. Understanding this hierarchy is crucial for effective development.
  </p>

  <h3>Core API Classes</h3>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Class</th>
          <th>Description</th>
          <th>Common Use Cases</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>Application</code></td>
          <td>Represents the Revit application instance</td>
          <td>Accessing application-level settings, creating new documents</td>
        </tr>
        <tr>
          <td><code>Document</code></td>
          <td>Represents an open Revit project or family</td>
          <td>Accessing project elements, creating transactions</td>
        </tr>
        <tr>
          <td><code>Element</code></td>
          <td>Base class for all Revit elements</td>
          <td>Walls, doors, windows, views, sheets, etc.</td>
        </tr>
        <tr>
          <td><code>Transaction</code></td>
          <td>Manages changes to the Revit model</td>
          <td>Creating, modifying, or deleting elements</td>
        </tr>
        <tr>
          <td><code>FilteredElementCollector</code></td>
          <td>Efficiently retrieves elements from the model</td>
          <td>Finding specific elements, filtering by category or type</td>
        </tr>
        <tr>
          <td><code>Parameter</code></td>
          <td>Represents element properties</td>
          <td>Reading/writing element data, custom parameters</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2>Creating Your First Revit Plugin</h2>
  <p>
    Let's build a simple "Hello World" plugin that displays information about selected elements. This will introduce you to the fundamental concepts of Revit API development.
  </p>

  <h3>Step 1: Set Up Your Visual Studio Project</h3>
  <ol>
    <li>Open Visual Studio and create a new <strong>Class Library (.NET Framework)</strong> project</li>
    <li>Name it "MyFirstRevitPlugin"</li>
    <li>Select <strong>.NET Framework 4.8</strong> as the target framework</li>
    <li>Add references to Revit API DLLs:
      <ul>
        <li><code>RevitAPI.dll</code></li>
        <li><code>RevitAPIUI.dll</code></li>
      </ul>
      These are typically located in: <code>C:\\Program Files\\Autodesk\\Revit 2023\\</code>
    </li>
    <li>Set "Copy Local" to <strong>False</strong> for both references</li>
  </ol>

  <div class="warning-box">
    <h4>Important</h4>
    <p>Always set "Copy Local" to False for Revit API references. This prevents version conflicts and ensures your plugin uses the correct Revit API version.</p>
  </div>

  <h3>Step 2: Create the External Command</h3>
  <p>
    Every Revit plugin needs at least one class that implements <code>IExternalCommand</code>. This is the entry point for your plugin.
  </p>

  <div class="code-block">
    <div class="code-header">ElementInfoCommand.cs</div>
    <pre><code>using System;
using System.Text;
using Autodesk.Revit.DB;
using Autodesk.Revit.UI;
using Autodesk.Revit.Attributes;

namespace MyFirstRevitPlugin
{
    [Transaction(TransactionMode.ReadOnly)]
    public class ElementInfoCommand : IExternalCommand
    {
        public Result Execute(
            ExternalCommandData commandData,
            ref string message,
            ElementSet elements)
        {
            // Get the current Revit document
            UIDocument uidoc = commandData.Application.ActiveUIDocument;
            Document doc = uidoc.Document;

            // Get the currently selected elements
            var selection = uidoc.Selection;
            var selectedIds = selection.GetElementIds();

            // Check if any elements are selected
            if (selectedIds.Count == 0)
            {
                TaskDialog.Show("Info", "Please select at least one element.");
                return Result.Cancelled;
            }

            // Build information string
            StringBuilder info = new StringBuilder();
            info.AppendLine($"Selected Elements: {selectedIds.Count}\\n");

            foreach (ElementId id in selectedIds)
            {
                Element element = doc.GetElement(id);
                
                info.AppendLine($"Element ID: {id.IntegerValue}");
                info.AppendLine($"Category: {element.Category?.Name ?? "N/A"}");
                info.AppendLine($"Type: {element.Name}");
                
                // Get element parameters
                info.AppendLine("\\nKey Parameters:");
                
                // Level parameter
                Parameter levelParam = element.get_Parameter(BuiltInParameter.FAMILY_LEVEL_PARAM);
                if (levelParam != null)
                {
                    info.AppendLine($"  Level: {levelParam.AsValueString()}");
                }
                
                // Comments parameter
                Parameter commentsParam = element.get_Parameter(BuiltInParameter.ALL_MODEL_INSTANCE_COMMENTS);
                if (commentsParam != null && !string.IsNullOrEmpty(commentsParam.AsString()))
                {
                    info.AppendLine($"  Comments: {commentsParam.AsString()}");
                }
                
                info.AppendLine(new string('-', 40));
            }

            // Display the information
            TaskDialog dialog = new TaskDialog("Element Information");
            dialog.MainInstruction = "Selected Element Details";
            dialog.MainContent = info.ToString();
            dialog.Show();

            return Result.Succeeded;
        }
    }
}</code></pre>
  </div>

  <h3>Step 3: Create the Add-in Manifest</h3>
  <p>
    The manifest file tells Revit how to load your plugin. Create a file named <code>MyFirstRevitPlugin.addin</code>:
  </p>

  <div class="code-block">
    <div class="code-header">MyFirstRevitPlugin.addin</div>
    <pre><code>&lt;?xml version="1.0" encoding="utf-8"?&gt;
&lt;RevitAddIns&gt;
  &lt;AddIn Type="Command"&gt;
    &lt;Name&gt;Element Info&lt;/Name&gt;
    &lt;Assembly&gt;MyFirstRevitPlugin.dll&lt;/Assembly&gt;
    &lt;ClientId&gt;12345678-1234-1234-1234-123456789012&lt;/ClientId&gt;
    &lt;FullClassName&gt;MyFirstRevitPlugin.ElementInfoCommand&lt;/FullClassName&gt;
    &lt;Text&gt;Element Info&lt;/Text&gt;
    &lt;Description&gt;Display information about selected elements&lt;/Description&gt;
    &lt;VendorId&gt;HSAB&lt;/VendorId&gt;
    &lt;VendorDescription&gt;Hossam Sabry&lt;/VendorDescription&gt;
  &lt;/AddIn&gt;
&lt;/RevitAddIns&gt;</code></pre>
  </div>

  <div class="info-box">
    <h4>ClientId GUID</h4>
    <p>Generate a unique GUID for your plugin using Visual Studio's Tools → Create GUID menu. This ensures your plugin doesn't conflict with others.</p>
  </div>

  <h3>Step 4: Deploy and Test</h3>
  <ol>
    <li>Build your project in Visual Studio</li>
    <li>Copy the compiled DLL and .addin file to:
      <code>C:\\ProgramData\\Autodesk\\Revit\\Addins\\2023\\</code>
    </li>
    <li>Launch Revit</li>
    <li>Go to the <strong>Add-Ins</strong> tab → <strong>External Tools</strong></li>
    <li>Click <strong>Element Info</strong></li>
    <li>Select an element and run the command</li>
  </ol>

  <h2>Working with Filtered Element Collectors</h2>
  <p>
    One of the most powerful features of the Revit API is the <code>FilteredElementCollector</code>. It allows you to efficiently query elements from the model.
  </p>

  <h3>Example: Collecting All Walls</h3>
  <div class="code-block">
    <div class="code-header">Collecting Elements</div>
    <pre><code>// Get all walls in the project
FilteredElementCollector collector = new FilteredElementCollector(doc);
ICollection&lt;Element&gt; walls = collector
    .OfClass(typeof(Wall))
    .ToElements();

TaskDialog.Show("Wall Count", $"Total walls: {walls.Count}");</code></pre>
  </div>

  <h3>Example: Filtering by Category</h3>
  <div class="code-block">
    <div class="code-header">Category Filtering</div>
    <pre><code>// Get all doors
FilteredElementCollector collector = new FilteredElementCollector(doc);
ICollection&lt;Element&gt; doors = collector
    .OfCategory(BuiltInCategory.OST_Doors)
    .WhereElementIsNotElementType()
    .ToElements();

// Get all door types
ICollection&lt;Element&gt; doorTypes = new FilteredElementCollector(doc)
    .OfCategory(BuiltInCategory.OST_Doors)
    .WhereElementIsElementType()
    .ToElements();</code></pre>
  </div>

  <h3>Performance Comparison</h3>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Method</th>
          <th>Elements</th>
          <th>Time (ms)</th>
          <th>Performance</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>FilteredElementCollector with filters</td>
          <td>10,000</td>
          <td>45</td>
          <td>Excellent</td>
        </tr>
        <tr>
          <td>FilteredElementCollector without filters</td>
          <td>10,000</td>
          <td>120</td>
          <td>✓ Good</td>
        </tr>
        <tr>
          <td>Iterating all elements manually</td>
          <td>10,000</td>
          <td>850</td>
          <td>Poor</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2>Understanding Transactions</h2>
  <p>
    Any modification to the Revit model must occur within a <code>Transaction</code>. This ensures data integrity and enables undo/redo functionality.
  </p>

  <h3>Transaction Modes</h3>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Mode</th>
          <th>Description</th>
          <th>Use Case</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>Manual</code></td>
          <td>You manage transactions explicitly</td>
          <td>Most common, gives full control</td>
        </tr>
        <tr>
          <td><code>ReadOnly</code></td>
          <td>No modifications allowed</td>
          <td>Querying data, generating reports</td>
        </tr>
        <tr>
          <td><code>Automatic</code></td>
          <td>Revit manages transactions automatically</td>
          <td>Simple commands with single operations</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h3>Example: Creating Elements with Transactions</h3>
  <div class="code-block">
    <div class="code-header">Transaction Example</div>
    <pre><code>[Transaction(TransactionMode.Manual)]
public class CreateWallCommand : IExternalCommand
{
    public Result Execute(
        ExternalCommandData commandData,
        ref string message,
        ElementSet elements)
    {
        UIDocument uidoc = commandData.Application.ActiveUIDocument;
        Document doc = uidoc.Document;

        // Start a transaction
        using (Transaction trans = new Transaction(doc, "Create Wall"))
        {
            trans.Start();

            try
            {
                // Get the first level
                Level level = new FilteredElementCollector(doc)
                    .OfClass(typeof(Level))
                    .FirstElement() as Level;

                // Define wall endpoints
                XYZ start = new XYZ(0, 0, 0);
                XYZ end = new XYZ(10, 0, 0);

                // Create a line
                Line line = Line.CreateBound(start, end);

                // Create the wall
                Wall wall = Wall.Create(doc, line, level.Id, false);

                // Set wall height
                Parameter heightParam = wall.get_Parameter(
                    BuiltInParameter.WALL_USER_HEIGHT_PARAM);
                heightParam.Set(10.0); // 10 feet

                // Commit the transaction
                trans.Commit();

                TaskDialog.Show("Success", "Wall created successfully!");
                return Result.Succeeded;
            }
            catch (Exception ex)
            {
                // Rollback on error
                trans.RollBack();
                message = ex.Message;
                return Result.Failed;
            }
        }
    }
}</code></pre>
  </div>

  <h2>Working with Parameters</h2>
  <p>
    Parameters store element properties and are essential for BIM data management. Understanding how to read and write parameters is crucial for any Revit API developer.
  </p>

  <h3>Parameter Types</h3>
  <div class="code-block">
    <div class="code-header">Reading Different Parameter Types</div>
    <pre><code>// String parameter
Parameter commentsParam = element.get_Parameter(BuiltInParameter.ALL_MODEL_INSTANCE_COMMENTS);
string comments = commentsParam?.AsString() ?? "";

// Double parameter (dimensions, areas, etc.)
Parameter areaParam = element.get_Parameter(BuiltInParameter.HOST_AREA_COMPUTED);
double area = areaParam?.AsDouble() ?? 0.0;

// Integer parameter
Parameter countParam = element.get_Parameter(BuiltInParameter.DOOR_NUMBER);
int doorNumber = countParam?.AsInteger() ?? 0;

// ElementId parameter (references to other elements)
Parameter levelParam = element.get_Parameter(BuiltInParameter.FAMILY_LEVEL_PARAM);
ElementId levelId = levelParam?.AsElementId();

// Convert units (Revit uses feet internally)
double areaInSquareMeters = UnitUtils.ConvertFromInternalUnits(
    area, 
    UnitTypeId.SquareMeters);</code></pre>
  </div>

  <h2>Best Practices and Tips</h2>

  <h3>1. Performance Optimization</h3>
  <ul>
    <li><strong>Use FilteredElementCollector efficiently</strong> - Apply filters before collecting</li>
    <li><strong>Minimize transactions</strong> - Group multiple operations into single transactions</li>
    <li><strong>Avoid unnecessary element access</strong> - Cache frequently used elements</li>
    <li><strong>Use quick filters</strong> - <code>WhereElementIsNotElementType()</code> is faster than manual filtering</li>
  </ul>

  <h3>2. Error Handling</h3>
  <div class="code-block">
    <div class="code-header">Robust Error Handling</div>
    <pre><code>public Result Execute(ExternalCommandData commandData, ref string message, ElementSet elements)
{
    try
    {
        UIDocument uidoc = commandData.Application.ActiveUIDocument;
        if (uidoc == null)
        {
            message = "No active document found.";
            return Result.Failed;
        }

        Document doc = uidoc.Document;
        
        // Your code here
        
        return Result.Succeeded;
    }
    catch (Autodesk.Revit.Exceptions.OperationCanceledException)
    {
        // User cancelled the operation
        return Result.Cancelled;
    }
    catch (Exception ex)
    {
        message = $"Error: {ex.Message}\\n\\nStack Trace:\\n{ex.StackTrace}";
        return Result.Failed;
    }
}</code></pre>
  </div>

  <h3>3. Debugging Tips</h3>
  <ul>
    <li><strong>Attach to Process</strong> - In Visual Studio, use Debug → Attach to Process → Revit.exe</li>
    <li><strong>Use TaskDialog for quick debugging</strong> - Display variable values during development</li>
    <li><strong>Enable detailed logging</strong> - Write to a log file for production plugins</li>
    <li><strong>Test with different Revit versions</strong> - API behavior can vary between versions</li>
  </ul>

  <h2>Common API Operations Reference</h2>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Operation</th>
          <th>Code Snippet</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Get active document</td>
          <td><code>Document doc = commandData.Application.ActiveUIDocument.Document;</code></td>
        </tr>
        <tr>
          <td>Get all elements of a category</td>
          <td><code>new FilteredElementCollector(doc).OfCategory(BuiltInCategory.OST_Walls)</code></td>
        </tr>
        <tr>
          <td>Get element by ID</td>
          <td><code>Element elem = doc.GetElement(new ElementId(123456));</code></td>
        </tr>
        <tr>
          <td>Get current selection</td>
          <td><code>ICollection&lt;ElementId&gt; ids = uidoc.Selection.GetElementIds();</code></td>
        </tr>
        <tr>
          <td>Convert units to meters</td>
          <td><code>UnitUtils.ConvertFromInternalUnits(value, UnitTypeId.Meters)</code></td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2>Next Steps</h2>
  <p>Now that you understand the basics of Revit API development, here are some next steps to continue your learning journey:</p>
  <ul>
    <li><strong>Explore the Revit SDK samples</strong> - Autodesk provides extensive sample code</li>
    <li><strong>Join the Revit API community</strong> - Forums like RevitAPIForum and Building Coder blog</li>
    <li><strong>Build a real project</strong> - Start with a simple automation task from your workflow</li>
    <li><strong>Learn about External Applications</strong> - Create ribbon panels and startup logic</li>
    <li><strong>Study advanced topics</strong> - Events, updaters, and external services</li>
  </ul>

  <div class="info-box">
    <h4>Recommended Resources</h4>
    <ul>
      <li><strong>The Building Coder</strong> - Jeremy Tammik's blog (essential reading)</li>
      <li><strong>Autodesk Developer Network</strong> - Official documentation and SDK</li>
      <li><strong>RevitAPIForum</strong> - Community Q&A</li>
      <li><strong>GitHub Revit API repositories</strong> - Open source examples</li>
    </ul>
  </div>

  <h2>Conclusion</h2>
  <p>
    The Revit API is a powerful tool that can dramatically improve productivity and enable custom solutions for BIM workflows. While there's a learning curve, the investment pays off quickly as you automate repetitive tasks and build tools tailored to your specific needs.
  </p>
  <p>
    Start small, experiment often, and don't hesitate to reach out to the community when you need help. Happy coding!
  </p>
`;

// Load the content when the page loads
document.addEventListener('DOMContentLoaded', function() {
  const articleContainer = document.getElementById('article-content');
  if (articleContainer) {
    articleContainer.innerHTML = articleContent;
  }
});
